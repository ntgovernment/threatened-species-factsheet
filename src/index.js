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

  render() {
    // Placeholder render method
    this.element.classList.add('threatened-species-factsheet');
    
    if (this.data) {
      this.element.innerHTML = this.generateFactsheetHTML(this.data);
    }
  }

  generateFactsheetHTML(data) {
    return `
      <div class="factsheet-container">
        <h2 class="factsheet-title">${data.title || 'Threatened Species'}</h2>
        <div class="factsheet-content">
          ${data.content || 'No content available'}
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
