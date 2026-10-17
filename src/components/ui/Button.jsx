import React, { Children, cloneElement, forwardRef } from 'react';

const join = (...parts) => parts.filter(Boolean).join(' ');

/** Gallery-branded interaction primitive. `asChild` keeps Router links semantic. */
const Button = forwardRef(function Button({
  asChild = false,
  variant = 'ghost',
  size = 'default',
  className,
  type = 'button',
  children,
  ...props
}, ref) {
  const classes = join('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className);

  if (asChild) {
    const child = Children.only(children);
    return cloneElement(child, {
      ...props,
      ref,
      className: join(child.props.className, classes),
    });
  }

  return <button ref={ref} type={type} className={classes} {...props}>{children}</button>;
});

export default Button;
