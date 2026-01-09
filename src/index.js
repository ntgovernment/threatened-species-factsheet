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
    this.allowHtml = options.allowHtml || false;
    
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

  /**
   * Safely render content - escapes HTML by default unless allowHtml is true
   * @param {string} content - Content to render
   * @param {boolean} allowHtml - Whether to allow HTML in content
   * @returns {string} Safe content
   */
  renderContent(content, allowHtml = false) {
    if (!allowHtml) {
      return this.escapeHtml(content);
    }
    // If allowHtml is true, content should be pre-sanitized by the caller
    return content;
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
    
    // Content rendering with XSS protection
    // By default, HTML is escaped. Set allowHtml: true in constructor to allow HTML
    const content = this.renderContent(
      data.content || 'No content available',
      this.allowHtml
    );
    
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
