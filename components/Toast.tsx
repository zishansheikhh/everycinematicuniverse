import { AnimatePresence, motion } from "framer-motion";

type ToastProps = {
  isVisible: boolean;
  message: string;
};

export default function Toast({ isVisible, message }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#11111C]/95 px-4 py-2 font-mono text-xs text-white shadow-2xl ring-1 ring-white/10"
          role="status"
          aria-live="polite"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
