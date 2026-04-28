export const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "unsigned_upload"); // Your unsigned preset

  try {
    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dtwbrtzcz/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const json = await res.json();

    if (!res.ok) {
      console.error("Cloudinary upload failed:", json);
      throw new Error(json.error?.message || "Upload failed");
    }

    return json.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};