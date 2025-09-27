import { App, Modal } from "obsidian";
import DiffModal from "@/ui/DiffModal.svelte";
import type { CanvasDiffPayload } from "@/ai/CanvasDiff";

export interface DiffModalHostProps {
  diff: CanvasDiffPayload;
  summary: string;
  message?: string;
  onAccept: () => void;
  onReject: () => void;
}

export class DiffModalHost extends Modal {
  private component?: DiffModal;
  private props: DiffModalHostProps;

  constructor(app: App, props: DiffModalHostProps) {
    super(app);
    this.props = props;
  }

  onOpen(): void {
    this.component = new DiffModal({
      target: this.contentEl,
      props: {
        diff: this.props.diff,
        summary: this.props.summary,
        message: this.props.message,
        onAccept: () => {
          this.props.onAccept();
          this.close();
        },
        onReject: () => {
          this.props.onReject();
          this.close();
        },
      },
    });
  }

  onClose(): void {
    this.component?.$destroy();
    this.component = undefined;
  }
}
