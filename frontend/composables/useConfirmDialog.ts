export type ConfirmVariant = 'danger' | 'warning' | 'default';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends Required<ConfirmOptions> {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
}

const state = reactive<ConfirmState>({
  open: false,
  title: 'تأیید',
  message: '',
  confirmText: 'تأیید',
  cancelText: 'انصراف',
  variant: 'danger',
  resolve: null,
});

function close(result: boolean) {
  state.open = false;
  const resolve = state.resolve;
  state.resolve = null;
  resolve?.(result);
}

export function useConfirmDialog() {
  function confirm(options: ConfirmOptions | string): Promise<boolean> {
    const opts = typeof options === 'string' ? { message: options } : options;

    if (state.open && state.resolve) {
      state.resolve(false);
    }

    state.title = opts.title ?? (opts.variant === 'warning' ? 'هشدار' : 'تأیید عملیات');
    state.message = opts.message;
    state.confirmText = opts.confirmText ?? (opts.variant === 'danger' || !opts.variant ? 'حذف' : 'تأیید');
    state.cancelText = opts.cancelText ?? 'انصراف';
    state.variant = opts.variant ?? 'danger';
    state.open = true;

    return new Promise<boolean>((resolve) => {
      state.resolve = resolve;
    });
  }

  return {
    state,
    confirm,
    accept: () => close(true),
    cancel: () => close(false),
  };
}
