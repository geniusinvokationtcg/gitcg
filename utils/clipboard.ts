export const handleCopy = async (text: string, triggerFn?: () => void) => {
  try {
    if(navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);

      //iOS handling
      if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        textarea.setSelectionRange(0, 999999);
      } else {
        textarea.select();
      }

      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if(triggerFn) triggerFn();
  } catch (e) {
    console.error(`Copying failed: ${e}`);
  }
}