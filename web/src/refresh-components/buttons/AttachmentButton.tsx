"use client";

import React from "react";
import { cn, noProp } from "@/lib/utils";
import Truncated from "@/refresh-components/texts/Truncated";
import IconButton from "@/refresh-components/buttons/IconButton";
import SvgTrash from "@/icons/trash";
import Text from "@/refresh-components/texts/Text";
import SvgExternalLink from "@/icons/external-link";
import { SvgProps } from "@/icons";
import { Checkbox } from "@/components/ui/checkbox";

const bgClassNames = {
  defaulted: ["bg-background-tint-00"],
  selected: ["bg-action-link-01"],
  processing: ["bg-background-tint-00"],
} as const;

const iconClassNames = {
  defaulted: ["stroke-text-02"],
  selected: [],
  processing: ["stroke-text-01"],
} as const;

interface AttachmentProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  processing?: boolean;

  leftIcon: React.FunctionComponent<SvgProps>;
  children: string;
  description: string;
  rightText: string;
  onView?: () => void;
  onDelete?: () => void;
}

export default function AttachmentButton({
  selected,
  processing,

  leftIcon: LeftIcon,
  children,
  description,
  rightText,
  onView,
  onDelete,
  className,
  ...rest
}: AttachmentProps) {
  const variant = selected
    ? "selected"
    : processing
      ? "processing"
      : "defaulted";

  return (
    <button
      type="button"
      className={cn(
        "flex flex-row w-full p-1 bg-background-tint-00 hover:bg-background-tint-02 rounded-12 gap-2 group/Attachment",
        bgClassNames[variant],
        className
      )}
      {...rest}
    >
      <div className="flex-1 flex flex-row gap-2 min-w-0">
        <div className="h-full aspect-square bg-background-tint-01 rounded-08 flex flex-col items-center justify-center">
          {selected ? (
            <Checkbox checked />
          ) : (
            <LeftIcon
              className={cn(iconClassNames[variant], "h-[1rem] w-[1rem]")}
            />
          )}
        </div>
        <div className="flex flex-col items-start justify-center min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-row items-center gap-2 min-w-0 overflow-hidden">
            <Truncated mainUiMuted text04 nowrap className="min-w-0 flex-1 overflow-hidden">
              {children}
            </Truncated>
            {onView && (
              <IconButton
                icon={SvgExternalLink}
                onClick={noProp(onView)}
                internal
                className="invisible group-hover/Attachment:visible flex-shrink-0"
              />
            )}
          </div>
          <Truncated secondaryBody text03 className="min-w-0 w-full">
            {description}
          </Truncated>
        </div>
      </div>

      <div className="flex-1 flex flex-row self-stretch justify-end items-center gap-2 p-1">
        <Text secondaryBody text03>
          {rightText}
        </Text>
        {onDelete && (
          <IconButton
            icon={SvgTrash}
            internal
            className="invisible group-hover/Attachment:visible"
            onClick={noProp(onDelete)}
          />
        )}
      </div>
    </button>
  );
}
