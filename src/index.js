// Import styles
import './styles/main.scss';

/**
 * Threatened Species Factsheet
 * Main entry point for the threatened species factsheet component
 */
class ThreatenedSpeciesFactsheet {
  constructor(options = {}) {
    this.element = options.element || null;
    this.data = options.data || null;
    
    if (this.element) {
      this.init();
    }
  }

  init() {
    if (!this.element) {
      console.error('ThreatenedSpeciesFactsheet: No element provided');
      return;
    }
    
    this.render();
  }

  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  render() {
    // Placeholder render method
    this.element.classList.add('threatened-species-factsheet');
    
    if (this.data) {
      this.element.innerHTML = this.generateFactsheetHTML(this.data);
    }
  }

  generateFactsheetHTML(data) {
    // Escape title to prevent XSS
    const escapedTitle = this.escapeHtml(data.title || 'Threatened Species');
    
    // For content, we allow HTML but it should be sanitized by the caller
    // or use textContent for plain text
    const content = data.content || 'No content available';
    
    return `
      <div class="factsheet-container">
        <h2 class="factsheet-title">${escapedTitle}</h2>
        <div class="factsheet-content">
          ${content}
        </div>
      </div>
    `;
  }

  update(data) {
    this.data = data;
    this.render();
  }
}

export default ThreatenedSpeciesFactsheet;
