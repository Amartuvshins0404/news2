import { createClient as createServiceClient } from "@supabase/supabase-js";

const BUCKET_NAME =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME ??
  process.env.SUPABASE_BUCKET_NAME ??
  "posts-images";
const DEFAULT_FOLDER =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET_ID ??
  process.env.SUPABASE_BUCKET_ID ??
  "posts";
const BUCKET_KEY_PREFIX =
  process.env.NEXT_PUBLIC_SUPABASE_BUCKET_KEY ??
  process.env.SUPABASE_BUCKET_KEY ??
  "";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const UPLOAD_ENDPOINT = "/api/v1/storage/upload";

function assertServiceCredentials() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase service credentials are not configured. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
}

export function getServiceRoleClient() {
  assertServiceCredentials();
  return createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function buildObjectPath(fileName: string, folder?: string) {
  const segments = [BUCKET_KEY_PREFIX, folder ?? DEFAULT_FOLDER]
    .filter(
      (segment) => typeof segment === "string" && segment.trim().length > 0
    )
    .map((segment) => segment!.trim());

  if (segments.length === 0) {
    return fileName;
  }

  return `${segments.join("/")}/${fileName}`;
}

function resolveStoragePath(path: string) {
  if (!path) return path;
  if (!path.startsWith("http")) return path;

  try {
    const url = new URL(path);
    const segments = url.pathname.split("/").filter(Boolean);
    const publicIndex = segments.indexOf("public");

    if (publicIndex !== -1) {
      const bucketSegment = segments[publicIndex + 1];
      const objectSegments = segments.slice(publicIndex + 2);

      if (bucketSegment === BUCKET_NAME && objectSegments.length > 0) {
        return objectSegments.join("/");
      }
    }

    return segments.join("/");
  } catch {
    return path;
  }
}

type StoredObjectInfo = {
  url: string;
  path: string;
  size: number;
};

function buildFolderPrefix(folder?: string) {
  const segments = [BUCKET_KEY_PREFIX, folder ?? DEFAULT_FOLDER]
    .filter(
      (segment) => typeof segment === "string" && segment.trim().length > 0
    )
    .map((segment) => segment!.trim());

  if (segments.length === 0) {
    return "";
  }

  return segments.join("/");
}

function generateUniqueObjectName(fileName: string) {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return `${timestamp}-${randomSuffix}-${fileName}`;
}

async function uploadWithServiceClient(
  file: File,
  folder?: string
): Promise<StoredObjectInfo> {
  const supabase = getServiceRoleClient();
  const bucket = supabase.storage.from(BUCKET_NAME);
  const sanitizedName = file.name.replace(/\s+/g, "-");
  const uniqueFileName = generateUniqueObjectName(sanitizedName);
  const objectPath = buildObjectPath(uniqueFileName, folder);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await bucket.upload(objectPath, buffer, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = bucket.getPublicUrl(objectPath);

  return { url: publicUrl, path: objectPath, size: buffer.byteLength };
}

async function deleteWithServiceClient(path: string): Promise<void> {
  const supabase = getServiceRoleClient();
  const bucket = supabase.storage.from(BUCKET_NAME);
  const objectPath = resolveStoragePath(path);

  const { error } = await bucket.remove([objectPath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

export async function uploadImage(
  file: File,
  folder?: string
): Promise<string> {
  if (typeof window === "undefined") {
    const { url } = await uploadWithServiceClient(file, folder);
    return url;
  }

  const formData = new FormData();
  formData.append("file", file);
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Upload failed");
  }

  const { url } = (await response.json()) as { url: string };
  return url;
}

export async function uploadMediaAsset(
  file: File,
  folder?: string
): Promise<{
  id: string;
  path: string;
  url: string;
  filename: string;
  mimetype: string | null;
  size: number;
  created_at: string;
}> {
  const { url, path, size } = await uploadWithServiceClient(file, folder);
  return {
    id: path,
    path,
    url,
    filename: file.name,
    mimetype: file.type || null,
    size: typeof file.size === "number" ? file.size : size,
    created_at: new Date().toISOString(),
  };
}

export async function deleteImage(path: string): Promise<void> {
  if (typeof window === "undefined") {
    await deleteWithServiceClient(path);
    return;
  }

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Delete failed");
  }
}

export async function listMediaAssets(folder?: string): Promise<
  Array<{
    id: string;
    path: string;
    url: string;
    filename: string;
    mimetype: string | null;
    size: number;
    created_at: string;
  }>
> {
  const supabase = getServiceRoleClient();
  const bucket = supabase.storage.from(BUCKET_NAME);
  const prefix = buildFolderPrefix(folder);
  const path = prefix.length > 0 ? prefix : undefined;

  const { data, error } = await bucket.list(path, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(`Failed to list media assets: ${error.message}`);
  }

  const files = data ?? [];

  return files.map((item) => {
    const objectPath = prefix.length > 0 ? `${prefix}/${item.name}` : item.name;
    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(objectPath);

    const metadata = item.metadata ?? {};
    const size =
      typeof metadata.size === "number"
        ? metadata.size
        : typeof metadata.Size === "number"
        ? metadata.Size
        : 0;
    const mimetype =
      (metadata.mimetype as string | undefined) ??
      (metadata.contentType as string | undefined) ??
      null;

    return {
      id: objectPath,
      path: objectPath,
      url: publicUrl,
      filename: item.name,
      mimetype,
      size,
      created_at: item.created_at ?? new Date().toISOString(),
    };
  });
}
