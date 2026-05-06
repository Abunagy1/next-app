'use server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function revalidatePathAction(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function revalidateTagAction(tags: string[]) {
  for (const tag of tags) revalidateTag(tag, {});
}