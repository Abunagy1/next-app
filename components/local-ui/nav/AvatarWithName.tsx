'use client';
import { ChevronRight } from 'lucide-react';
import user from '@/public/travel/icons/user.svg';
import card from '@/public/travel/icons/card.svg';
import settings from '@/public/travel/icons/settings.svg';
import support from '@/public/travel/icons/support.svg';
import logout from '@/public/travel/icons/logout.svg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOutAction } from '@/app/lib/actions';
import routes from '@/data/routes.json';

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface AvatarWithNameProps {
  sideBarLinksUser: SidebarLink[];
  onlineStatus?: string;
  image?: string;
  profileName?: string;
}

export function AvatarWithName({
  sideBarLinksUser,
  onlineStatus = 'Online',
  image = '',
  profileName = 'John Doe',
}: AvatarWithNameProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="focus-visible:ring-offset-[none]">
        <Button variant="link" className="gap-2 text-inherit">
          <Avatar>
            <AvatarImage src={image} className="rounded-full" />
            <AvatarFallback></AvatarFallback>
          </Avatar>
          <span>{profileName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={20} align="end" className="w-[300px] p-4 font-medium">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Image
              src={image}
              alt="profile_pic"
              height={50}
              width={50}
              className="rounded-full"
            />
            <div>
              <p className="font-semibold">{profileName}</p>
              <p className="text-sm opacity-75">{onlineStatus}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-4" />
        <DropdownMenuGroup>
          {sideBarLinksUser.map((option, index) => (
            <DropdownMenuItem key={index} asChild className="cursor-pointer justify-between">
              <Link href={option.href}>
                <div className="flex items-center gap-2">
                  {option.icon} <span>{option.title}</span>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-4" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer justify-between">
            <Link href={routes.support.path}>
              <div className="flex items-center gap-2">
                <Image src={support} alt="support_icon" height={18} width={18} />
                <span>{routes.support.title}</span>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <form action={signOutAction}>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-2 p-0 font-medium text-inherit"
                type="submit"
              >
                <Image src={logout} alt="logout_icon" height={18} width={18} />
                <span>Logout</span>
              </Button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}