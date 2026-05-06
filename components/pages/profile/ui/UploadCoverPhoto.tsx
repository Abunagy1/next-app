'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useActionState } from "react";
import { useToast } from '@/components/ui/use-toast';
import { updateCoverPhotoAction } from '@/app/lib/actions/updateProfileActions';
import upload from '@/public/travel/icons/upload.svg';
//import error from '@/app/blog/posts/[id]/error';
interface UploadCoverPhotoState {
  success?: boolean;
  message?: string;
  error?: string; // 添加 error
}

export function UploadCoverPhoto() {
  const [file, setFile] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  // const [state, formAction] = useFormState(updateCoverPhotoAction, undefined);
  // Inside the component, use the correct state type

  const [state, formAction] = useActionState<UploadCoverPhotoState, FormData>(updateCoverPhotoAction, {});
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success',
        description: 'Your cover photo has been uploaded',
      });
      Promise.resolve().then(() => {
        setOpened(false);
        setFile(null);
      });
    } else if (state?.error ) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <Dialog open={opened} onOpenChange={setOpened}>
      <DialogTrigger asChild>
        <Button className="gap-1 h-auto p-2">
          <Image alt="upload_icon" width={24} height={24} style={{ width: 'auto', height: 'auto' }} src={upload} />
          <span className="hidden sm:inline">Upload new cover</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Upload new cover photo</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Want to update your cover photo? Upload a new one.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label
              htmlFor="upload-cover-photo-form"
              className="cursor-pointer flex items-center justify-center bg-gray-100 rounded-md border border-gray-200 p-2 text-center w-full"
            >
              <span className="text-sm text-gray-500">Choose a file</span>
            </Label>
            <Input
              id="upload-cover-photo-form"
              name="upload-cover-photo-form"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const img = URL.createObjectURL(e.currentTarget.files![0]);
                setFile(img);
              }}
            />
            <Button type="submit" size="sm" className="px-3" disabled={!file}>
              <span className="sr-only">Submit</span>
              <Image alt="upload" src={upload} width={16} height={16} style={{ width: 'auto', height: 'auto' }}/>
            </Button>
            <div className="h-24 w-24">
              <Dialog>
                {file && (
                  <DialogTrigger
                    className="rounded-md bg-gray-100 overflow-hidden"
                    asChild
                  >
                    <Image
                      className="h-full cursor-pointer w-full object-contain"
                      src={file}
                      width={96}
                      height={96}
                      style={{ width: 'auto', height: 'auto' }}
                      alt="preview"
                    />
                  </DialogTrigger>
                )}
                <DialogContent className="h-[350px] p-2 box-content max-w-[1296px]">
                  <DialogHeader>
                    <DialogTitle>Preview:</DialogTitle>
                  </DialogHeader>
                  <Image
                    className="h-full rounded-[12px] w-full object-cover"
                    src={file!}
                    width={1296}
                    height={350}
                    style={{ width: 'auto', height: 'auto' }}
                    alt="preview"
                  />
                  <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                      <Button type="button" size="sm" variant="secondary">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </form>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" size="sm" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}