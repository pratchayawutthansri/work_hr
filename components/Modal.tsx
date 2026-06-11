"use client";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({ isOpen, title, onClose, children, actions }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="action-modal" onClick={onClose}>
      <div className="action-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>{title}</h3>
          <button className="icon-button close-panel-button" onClick={onClose} type="button" aria-label="ปิด">
            ×
          </button>
        </div>
        <div className="action-dialog-body">
          {children}
        </div>
        {actions && (
          <div className="entry-actions" style={{ padding: "0 24px 24px" }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
