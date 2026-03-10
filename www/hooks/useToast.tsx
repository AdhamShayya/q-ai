import { toast, ToastOptions } from "react-toastify";

const defaults: ToastOptions = { position: "top-center" };

export function useToast() {
  return {
    success: (message: string, options?: ToastOptions) =>
      toast.success(message, { ...defaults, ...options }),
    error: (message: string, options?: ToastOptions) =>
      toast.error(message, { ...defaults, ...options }),
  };
}

export default useToast;
