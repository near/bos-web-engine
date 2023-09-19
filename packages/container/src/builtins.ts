import type {
  BuiltinComponents,
  BuiltinProps,
  FilesProps,
  GetBuiltinsParams,
  InfiniteScrollProps,
  IpfsImageUploadProps,
  MarkdownProps,
  OverlayTriggerProps,
  TypeaheadProps,
} from './types';

export function getBuiltins({ createElement }: GetBuiltinsParams): BuiltinComponents {
  return {
    Checkbox: ({ children, props } : BuiltinProps<object>) => {
      return createElement('div', props,  children);
    },
    CommitButton: ({ children, props } : BuiltinProps<object>) => {
      return createElement('div', props,  children);
    },
    Dialog: ({ children, props } : BuiltinProps<object>) => {
      return createElement('div', props,  children);
    },
    DropdownMenu: ({ children, props } : BuiltinProps<object>) => {
      return createElement('div', props,  children);
    },
    Files: ({ children, props } : BuiltinProps<FilesProps>) => {
      return createElement('div', props,  children);
    },
    Fragment: ({ children, props } : BuiltinProps<object>) => {
      return createElement('div', props,  children);
    },
    InfiniteScroll: ({ children, props } : BuiltinProps<InfiniteScrollProps>) => {
      return createElement('div', props,  children);
    },
    IpfsImageUpload: ({ children, props } : BuiltinProps<IpfsImageUploadProps>) => {
      return createElement('div', props,  children);
    },
    Link: ({ children, props } : BuiltinProps<object>) => {
      return createElement('div', props,  children);
    },
    Markdown: ({ children, props } : BuiltinProps<MarkdownProps>) => {
      return createElement('div', props,  [props?.text, ...children]);
    },
    OverlayTrigger: ({ children, props } : BuiltinProps<OverlayTriggerProps>) => {
      return createElement('div', props, children);
    },
    Tooltip: ({ children, props } : BuiltinProps<object>) => {
      return createElement('div', props,  children);
    },
    Typeahead: ({ children, props } : BuiltinProps<TypeaheadProps>) => {
      return createElement('div', props,  children);
    },
  };
}
