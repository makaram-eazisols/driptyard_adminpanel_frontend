import { toast } from "react-toastify";

const defaultOptions = {
  position: "bottom-right",
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const notifySuccess = (message, options = {}) =>
  toast.success(message, { ...defaultOptions, ...options });

export const notifyError = (message, options = {}) =>
  toast.error(message, { ...defaultOptions, ...options });

export const notifyInfo = (message, options = {}) =>
  toast.info(message, { ...defaultOptions, ...options });

export const notifyWarning = (message, options = {}) =>
  toast.warning(message, { ...defaultOptions, ...options });

export const notify = (message, options = {}) =>
  toast(message, { ...defaultOptions, ...options });

