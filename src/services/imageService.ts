import Together from "together-ai";
import axios from "axios";
import { auth, db } from "../lib/firebase";
import { hasEnoughCredits, deductCredits, isEmailVerified } from "./auth";
import { toast } from 'sonner';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Custom event for credit updates
const CREDIT_UPDATE_EVENT = 'creditUpdate';

// Initialize Together client with environment variable if available
let together: Together | null = null;

export function initializeTogether(apiKey: string) {
  // Try to use the provided API key or fall back to environment variable (if set)
  const key = apiKey || import.meta.env.VITE_TOGETHER_API_KEY;
  if (!key) {
    throw new Error("API key is required");
  }
  together = new Together({ apiKey: key });
  return together;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  try {
    if (!together) {
      throw new Error("API client is not initialized. Please provide an API key first.");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error("User must be logged in to generate images");
    }
    
    // Check if email is verified
    const verified = await isEmailVerified(user.uid);
    if (!verified) {
      toast.error("Please verify your email before generating images.");
      throw new Error("Email not verified. Please check your inbox for verification link.");
    }

    // Check if user has enough credits before making the API request
    const hasCredits = await hasEnoughCredits(user.uid);
    if (!hasCredits) {
      toast.error("Insufficient credits. Please purchase more credits to continue.");
      throw new Error("Insufficient credits. Please purchase more credits to continue.");
    }

    // Generate the image
    const response = await together.images.create({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt: prompt,
      steps: 4, // Steps must be between 1-4
      n: 1 // Generate one image
    });

    const imageUrl = response.data[0].url;
    
    // Deduct credits after successful generation
    await deductCredits(user.uid);
    
    // Dispatch credit update event
    window.dispatchEvent(new Event(CREDIT_UPDATE_EVENT));
    
    const imageId = Date.now().toString();
    const generatedImage = {
      id: imageId,
      url: imageUrl,
      prompt: prompt
    };
    
    // Save to Firestore as the last generated image with timestamp
    try {
      const timestamp = new Date();
      const lastImageData = {
        imageId,
        url: imageUrl,
        prompt,
        createdAt: timestamp.toISOString(),
        timestamp: timestamp, // Firestore timestamp
        date: timestamp.toLocaleDateString(),
        time: timestamp.toLocaleTimeString()
      };
      
      // Update the user's document with the last image info
      await updateDoc(doc(db, 'users', user.uid), {
        lastGeneratedImage: lastImageData
      });
      console.log('Last image saved to user document in Firestore');
    } catch (saveError) {
      console.error('Error saving last image to Firestore:', saveError);
      // Continue even if saving to Firestore fails
    }
    
    return generatedImage;
  } catch (error) {
    console.error("Error generating image:", error);
    
    // Check if it's an API error
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("API client")) {
        toast.error("Invalid API key. Please check your API key and try again.");
      } else if (error.message.includes("Insufficient credits")) {
        // Don't show the toast again since we already showed it in the credit check
      } else if (error.message.includes("Email not verified")) {
        // Don't show the toast again since we already showed it in the verification check
      } else {
        toast.error("Failed to generate image. Please try again.");
      }
    } else {
      toast.error("Failed to generate image. Please try again.");
    }
    
    throw error;
  }
}

/**
 * Retrieves the last generated image for a user from Firestore
 * @param userId The user ID to retrieve the last image for
 * @returns The last generated image data or null if not found
 */
export async function getLastGeneratedImage(userId: string) {
  try {
    if (!userId) {
      console.error("User ID is required to retrieve last image");
      return null;
    }
    
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().lastGeneratedImage) {
      return docSnap.data().lastGeneratedImage;
    } else {
      console.log("No last image found for user");
      return null;
    }
  } catch (error) {
    console.error("Error retrieving last generated image:", error);
    return null;
  }
}
