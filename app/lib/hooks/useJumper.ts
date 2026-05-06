import { capitalize } from '@/app/lib/utils';

export function useJumper(ids: string[] = []) {
  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const jumpFuncs: Record<string, () => void> = {};
  ids.forEach((id) => {
    const capitalizedId = capitalize(id);
    jumpFuncs[`jumpTo${capitalizedId}`] = () => jump(id);
  });

  return jumpFuncs;
}