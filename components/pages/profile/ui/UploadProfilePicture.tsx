'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import AvatarEditor from 'react-avatar-editor';
import { toast } from 'sonner';
import { updateProfilePictureAction } from '@/app/lib/actions/updateProfileActions';
import pen from '@/public/travel/icons/pen.svg';
import { LoaderIcon } from 'lucide-react';

export function UploadProfilePicture() {
  const [file, setFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isDialogOpened, setIsDialogOpened] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<AvatarEditor>(null);

  const handleSave = () => {
    if (!editorRef.current) return;
    const image = editorRef.current.getImage().toDataURL();
    setPreview(image);
    setSaved(true);
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('profilePic', preview);
    const state = await updateProfilePictureAction(null, formData);
    setUploading(false);
    if (state?.success) {
      setFile(null);
      setPreview(null);
      setSaved(false);
      setIsDialogOpened(false);
      toast.success(state.message || 'Your avatar has been uploaded');
    } else {
      toast.error(state?.message || 'Something went wrong');
    }
  };

  return (
    <Dialog open={isDialogOpened} onOpenChange={setIsDialogOpened}>
      <DialogTrigger asChild>
        <Button
          className="absolute bottom-0 right-0 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-tertiary p-0"
          variant="ghost"
          onClick={() => setIsDialogOpened(!isDialogOpened)}
        >
          <Image className="h-auto w-auto" width={44} height={44} src={pen} alt="edit" />
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Upload new avatar</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Want to update your avatar? Upload a new one.
          </DialogDescription>
        </DialogHeader>
        <form id="upload_profile_pic_form" className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label
              htmlFor="upload-profile-pic"
              className="flex w-full cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-gray-100 p-2 text-center dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              <span className="text-sm text-gray-500">Choose a file</span>
            </Label>
            <input
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  const img = URL.createObjectURL(file);
                  setFile(img);
                  setSaved(false);
                }
              }}
              accept="image/png, image/jpeg, image/jpg, image/gif"
              id="upload-profile-pic"
              type="file"
              className="hidden"
              name="upload-profile-pic"
            />
          </div>
        </form>
        <div className="mx-auto h-auto w-auto rounded-lg">
          {file && !saved && (
            <AvatarEditor
              className="rounded-lg"
              ref={editorRef}
              image={file}
              width={300}
              height={300}
              border={2}
              borderRadius={111111}
              color={[0, 0, 0, 0.7]}
              scale={1}
              rotate={0}
            />
          )}
          {saved && preview && (
            <Image
              className="h-[300px] w-auto rounded-full border-4 border-destructive"
              width={200}
              height={200}
              src={preview}
              alt="preview_profile_pic"
            />
          )}
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          {file && !saved ? (
            <Button type="button" size="lg" className="w-[200px]" onClick={handleSave}>
              Save
            </Button>
          ) : file && saved ? (
            <Button type="button" size="lg" className="w-[200px]" onClick={() => setSaved(false)}>
              Edit
            </Button>
          ) : null}
          {preview && (
            <Button className="w-[200px]" size="lg" onClick={handleUpload} disabled={uploading}>
              {uploading ? <LoaderIcon className="animate-spin" /> : 'Upload'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}