import { toast } from "react-toastify";
import { ToastMessage } from "@/components/ui/toast-message";

const defaultOptions = {
  position: "bottom-right",
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: true,
  icon: false,
  autoClose: 8000,
};

const renderToastContent = (type, message, options) => {
  const titles = {
    success: "Success",
    error: "Error",
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const toastId = toast(
    <ToastMessage type={type} title={options?.title ?? titles[type]} description={message} />,
    mergedOptions,
  );

  if (mergedOptions.autoClose !== false) {
    const timeout = typeof mergedOptions.autoClose === "number" ? mergedOptions.autoClose : defaultOptions.autoClose;
    if (timeout && timeout > 0) {
      setTimeout(() => toast.dismiss(toastId), timeout);
    }
  }

  return toastId;
};

export const notifySuccess = (message, options = {}) => renderToastContent("success", message, options);

export const notifyError = (message, options = {}) => renderToastContent("error", message, options);

export const notifyInfo = (message, options = {}) =>
  toast.info(message, { ...defaultOptions, ...options });

export const notifyWarning = (message, options = {}) =>
  toast.warning(message, { ...defaultOptions, ...options });

export const notify = (message, options = {}) =>
  toast(message, { ...defaultOptions, ...options });

