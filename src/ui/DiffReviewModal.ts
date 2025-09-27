import { Modal } from 'obsidian';
import DiffReviewModalComponent from '@/ui/DiffReviewModal.svelte';

interface DiffReviewOptions {
  summary?: string;
  patch: string;
  onAccept: () => void;
  onReject: () => void;
}

export class DiffReviewModal extends Modal {
  private component?: DiffReviewModalComponent;
  private options: DiffReviewOptions;

  constructor(app: Modal['app'], options: DiffReviewOptions) {
    super(app);
    this.options = options;
  }

  onOpen(): void {
    this.component = new DiffReviewModalComponent({
      target: this.contentEl,
      props: {
        summary: this.options.summary,
        patch: this.options.patch,
        onAccept: () => {
          this.options.onAccept();
          this.close();
        },
        onReject: () => {
          this.options.onReject();
          this.close();
        }
      }
    });
  }

  onClose(): void {
    this.component?.$destroy();
    this.component = undefined;
  }
}
