// ─── User Profile (localStorage) ─────────────────────────────
// Almacena nombre y avatar del operador/usuario en localStorage.

const STORAGE_KEY = "openclaw.user-profile";

export interface UserProfile {
  name: string;
  avatar: string | null; // data URI o null
}

const DEFAULT_PROFILE: UserProfile = { name: "User", avatar: null };

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : DEFAULT_PROFILE.name,
      avatar: typeof parsed.avatar === "string" ? parsed.avatar : null,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage lleno o deshabilitado — ignorar
  }
}

export function setUserName(name: string): UserProfile {
  const profile = getUserProfile();
  profile.name = name.trim() || DEFAULT_PROFILE.name;
  saveProfile(profile);
  return profile;
}

export function setUserAvatar(dataUri: string): UserProfile {
  const profile = getUserProfile();
  profile.avatar = dataUri;
  saveProfile(profile);
  return profile;
}

export function removeUserAvatar(): UserProfile {
  const profile = getUserProfile();
  profile.avatar = null;
  saveProfile(profile);
  return profile;
}

/**
 * Redimensiona una imagen (File) a un máximo de maxSize px y devuelve un data URI.
 */
export function resizeImageToDataUri(file: File, maxSize = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/webp", 0.85));
      };
      img.onerror = () => reject(new Error("image load failed"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}
