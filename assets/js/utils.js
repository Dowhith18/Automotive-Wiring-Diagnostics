/**
 * Utility functions for AutoDiag application
 */

// ===== DOM UTILITIES =====
const $ = (selector) => document.querySelector(selector);
const $ = (selector) => document.querySelectorAll(selector);

// ===== LOCAL STORAGE UTILITIES =====
const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// ===== NOTIFICATION SYSTEM =====
const Notifications = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notifications-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 5000) {
    this.init();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      pointer-events: auto;
      margin-bottom: 10px;
      padding: 16px;
      background: var(--surface-dark);
      border-radius: 8px;
      border: 1px solid var(--surface-light);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.3s ease;
      max-width: 400px;
      position: relative;
    `;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    if (colors[type]) {
      notification.style.borderLeftColor = colors[type];
      notification.style.borderLeftWidth = '4px';
    }

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: var(--text-light);">
        <span style="font-size: 1.2em;">${this.getIcon(type)}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="margin-left: auto; background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2em;">×</button>
      </div>
    `;

    this.container.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }

    return notification;
  },

  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  },

  success(message, duration) {
    return this.show(message, 'success', duration);
  },

  error(message, duration) {
    return this.show(message, 'error', duration);
  },

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
};

// ===== VALIDATION UTILITIES =====
const Validator = {
  email(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  phone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\D/g, ''));
  },

  required(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },

  minLength(value, min) {
    return String(value).length >= min;
  },

  maxLength(value, max) {
    return String(value).length <= max;
  },

  numeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  positive(value) {
    return this.numeric(value) && parseFloat(value) > 0;
  },

  range(value, min, max) {
    const num = parseFloat(value);
    return this.numeric(value) && num >= min && num <= max;
  }
};

// ===== DATE/TIME UTILITIES =====
const DateUtils = {
  format(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  timeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },

  isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  }
};

// ===== ARRAY UTILITIES =====
const ArrayUtils = {
  unique(array) {
    return [...new Set(array)];
  },

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
      const aValue = typeof key === 'function' ? key(a) : a[key];
      const bValue = typeof key === 'function' ? key(b) : b[key];
      
      if (direction === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      }
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    });
  }
};

// ===== STRING UTILITIES =====
const StringUtils = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  truncate(str, length, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  template(str, variables) {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
};

// ===== PERFORMANCE UTILITIES =====
const Performance = {
  measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name}: ${end - start}ms`);
    return result;
  },

  async measureAsync(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name}: ${end - start}ms`);
    return result;
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// ===== API UTILITIES =====
const API = {
  async request(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  },

  post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
};

// ===== ELECTRICAL CALCULATION UTILITIES =====
const ElectricalUtils = {
  // Ohm's Law calculations
  calculateVoltage(current, resistance) {
    return current * resistance;
  },

  calculateCurrent(voltage, resistance) {
    return resistance !== 0 ? voltage / resistance : 0;
  },

  calculateResistance(voltage, current) {
    return current !== 0 ? voltage / current : 0;
  },

  calculatePower(voltage, current) {
    return voltage * current;
  },

  // Wire gauge calculations
  getWireResistance(gauge, length) {
    const resistancePerFoot = {
      '12': 0.00193,  // ohms per foot
      '14': 0.00307,
      '16': 0.00488,
      '18': 0.00777,
      '20': 0.01237
    };
    return (resistancePerFoot[gauge] || 0) * length;
  },

  calculateVoltageDrop(current, wireGauge, length) {
    const resistance = this.getWireResistance(wireGauge, length);
    return current * resistance;
  },

  // Battery calculations
  calculateBatteryHealth(measuredVoltage, ratedVoltage = 12.6) {
    const percentage = (measuredVoltage / ratedVoltage) * 100;
    return Math.min(100, Math.max(0, percentage));
  },

  getBatteryStatus(voltage) {
    if (voltage >= 12.6) return { status: 'Good', color: '#10b981' };
    if (voltage >= 12.0) return { status: 'Weak', color: '#f59e0b' };
    if (voltage >= 11.5) return { status: 'Poor', color: '#ef4444' };
    return { status: 'Dead', color: '#dc2626' };
  }
};

// ===== DIAGNOSTIC DATA STRUCTURES =====
const DiagnosticData = {
  faultTypes: {
    SHORT_CIRCUIT: 'short_circuit',
    OPEN_CIRCUIT: 'open_circuit',
    INSULATION_BREAKDOWN: 'insulation_breakdown',
    CONNECTOR_CORROSION: 'connector_corrosion',
    WIRE_FATIGUE: 'wire_fatigue',
    GROUND_FAULT: 'ground_fault',
    OVERLOAD: 'overload'
  },

  severityLevels: {
    LOW: { level: 1, label: 'Low', color: '#10b981' },
    MEDIUM: { level: 2, label: 'Medium', color: '#f59e0b' },
    HIGH: { level: 3, label: 'High', color: '#ef4444' },
    CRITICAL: { level: 4, label: 'Critical', color: '#dc2626' }
  },

  vehicleMakes: [
    'Toyota', 'Ford', 'Chevrolet', 'Honda', 'Nissan', 
    'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai',
    'Kia', 'Mazda', 'Subaru', 'Volvo', 'Jeep'
  ],

  symptoms: [
    { id: 'no_start', label: 'Engine won\'t start', category: 'starting' },
    { id: 'intermittent_power', label: 'Intermittent power loss', category: 'power' },
    { id: 'burning_smell', label: 'Burning smell', category: 'warning' },
    { id: 'blown_fuses', label: 'Blown fuses', category: 'electrical' },
    { id: 'corrosion_visible', label: 'Visible corrosion', category: 'physical' },
    { id: 'flickering_lights', label: 'Flickering lights', category: 'lighting' },
    { id: 'dead_battery', label: 'Dead battery', category: 'power' },
    { id: 'overheating', label: 'Component overheating', category: 'thermal' }
  ]
};

// ===== ANIMATION UTILITIES =====
const AnimationUtils = {
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    return new Promise(resolve => {
      const start = performance.now();
      
      function animate(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      }
      
      requestAnimationFrame(animate);
    });
  },

  fadeOut(element, duration = 300) {
    return new Promise(resolve => {
      const start = performance.now();
      const initialOpacity = parseFloat(getComputedStyle(element).opacity);
      
      function animate(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = initialOpacity * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.style.display = 'none';
          resolve();
        }
      }
      
      requestAnimationFrame(animate);
    });
  },

  slideDown(element, duration = 300) {
    element.style.height = '0px';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    const fullHeight = element.scrollHeight;
    
    return new Promise(resolve => {
      const start = performance.now();
      
      function animate(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.height = (fullHeight * progress) + 'px';
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.style.height = '';
          element.style.overflow = '';
          resolve();
        }
      }
      
      requestAnimationFrame(animate);
    });
  }
};

// ===== EXPORT FOR MODULE SYSTEMS =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Storage,
    Notifications,
    Validator,
    DateUtils,
    ArrayUtils,
    StringUtils,
    Performance,
    API,
    ElectricalUtils,
    DiagnosticData,
    AnimationUtils
  };
}

// ===== GLOBAL ERROR HANDLER =====
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  Notifications.error('An unexpected error occurred. Please try again.');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  Notifications.error('A network or processing error occurred.');
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 AutoDiag Utils loaded successfully');
});