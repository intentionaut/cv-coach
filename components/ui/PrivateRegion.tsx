import { PRIVATE_ATTR } from '@/lib/privacy';

/**
 * Wraps any render of a user's contact details.
 *
 * The client half of the rule in `lib/privacy.ts`. Anything inside this
 * carries `data-private`, which is the single selector every masking
 * mechanism keys off — session replay, screenshot tooling, and any admin view
 * that ever displays a user's document.
 *
 * Use it around name, email, phone and address. Not around CV content: the
 * summary and experience are the thing the product works on, and hiding them
 * from a recording removes the reason for having one.
 *
 * `title` is deliberately not passed through to a tooltip — a masked region
 * that leaks its content on hover would defeat the point.
 */
export default function PrivateRegion({
  children,
  className = '',
  as: Tag = 'div'
}: {
  children: React.ReactNode;
  className?: string;
  /** Defaults to a div; pass 'span' for inline use. */
  as?: 'div' | 'span' | 'section';
}) {
  return (
    <Tag {...{ [PRIVATE_ATTR]: 'contact' }} className={className}>
      {children}
    </Tag>
  );
}
