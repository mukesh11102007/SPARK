import { WebContainer } from '@webcontainer/api';

let webcontainerInstance = null;

export const bootWebContainer = async () => {
  if (webcontainerInstance) return webcontainerInstance;

  console.log('[WebContainerService] Booting WebContainer...');
  
  try {
    // Call only once
    webcontainerInstance = await WebContainer.boot();
    console.log('[WebContainerService] Booted successfully.');
    
    // We would typically mount files here
    // await webcontainerInstance.mount(files);
    
    return webcontainerInstance;
  } catch (error) {
    console.error('[WebContainerService] Failed to boot WebContainer:', error);
    throw error;
  }
};

export const mountFiles = async (files) => {
    if (!webcontainerInstance) throw new Error("WebContainer not booted");
    await webcontainerInstance.mount(files);
}
