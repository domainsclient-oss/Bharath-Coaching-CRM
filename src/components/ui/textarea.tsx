import * as React from 'react';

import {capitalizeInput, capitalizeSentences, cn} from '@/lib/utils';

// Capitalises the start of each sentence as you type; pass autoCapitalize="off" to opt out
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, autoCapitalize, onChange, ...props}, ref) => {
    const capitalize = autoCapitalize !== 'off' && autoCapitalize !== 'none';
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        autoCapitalize={capitalize ? 'sentences' : autoCapitalize}
        onChange={capitalize ? (e) => { capitalizeInput(e, capitalizeSentences); onChange?.(e); } : onChange}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
