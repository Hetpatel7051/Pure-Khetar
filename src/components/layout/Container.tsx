import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef, ElementType } from 'react';

type ContainerProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>;

/** Standard page-width wrapper so every section lines up with the navbar. */
export function Container<T extends ElementType = 'div'>({ as, className, ...props }: ContainerProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag
      className={cn('mx-auto w-full max-w-[1720px] px-6 sm:px-10 lg:px-16 2xl:px-20', className)}
      {...props}
    />
  );
}