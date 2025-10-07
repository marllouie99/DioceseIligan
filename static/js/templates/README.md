# JavaScript Module Templates

This directory contains reusable templates for common JavaScript patterns in the ChurchConnect project.

## 📁 **Available Templates**

### **1. Module Template** (`module-template.js`)
**Purpose**: Basic module structure for any functionality
**Use Cases**: 
- UI components
- Utility modules
- Feature modules
- Widget modules

**Key Features**:
- Constructor with configuration
- Initialization lifecycle
- Error handling
- Cleanup methods
- JSDoc documentation

### **2. Main App Template** (`main-app-template.js`)
**Purpose**: Application coordinator for orchestrating modules
**Use Cases**:
- Main application files
- Feature coordinators
- Page-specific applications

**Key Features**:
- Module management
- Global function exposure
- Event delegation
- Performance optimizations
- Keyboard shortcuts

### **3. API Module Template** (`api-module-template.js`)
**Purpose**: API interaction and HTTP requests
**Use Cases**:
- REST API clients
- Data fetching modules
- External service integration

**Key Features**:
- Request/response interceptors
- Retry logic with exponential backoff
- Authentication handling
- Error handling
- Request cancellation

### **4. Form Module Template** (`form-module-template.js`)
**Purpose**: Form handling and validation
**Use Cases**:
- Contact forms
- User registration
- Settings forms
- Data entry forms

**Key Features**:
- Client-side validation
- Custom validators
- Error display
- Loading states
- Success/error callbacks

### **5. Modal Module Template** (`modal-module-template.js`)
**Purpose**: Modal dialog management
**Use Cases**:
- Confirmation dialogs
- Form modals
- Image galleries
- Settings panels

**Key Features**:
- Animation support
- Focus trap
- Keyboard navigation
- Backdrop handling
- Event system

### **6. Data Table Template** (`data-table-template.js`)
**Purpose**: Data tables with advanced features
**Use Cases**:
- User lists
- Data grids
- Admin tables
- Report tables

**Key Features**:
- Sorting
- Filtering
- Pagination
- Search
- Custom cell rendering

## 🚀 **How to Use Templates**

### **Step 1: Choose the Right Template**
```javascript
// For basic functionality
import { ModuleTemplate } from './templates/module-template.js';

// For API interactions
import { ApiModuleTemplate } from './templates/api-module-template.js';

// For form handling
import { FormModuleTemplate } from './templates/form-module-template.js';
```

### **Step 2: Customize the Template**
```javascript
// Replace placeholders
class UserManagement extends ModuleTemplate {
  constructor(config = {}) {
    super({
      // Your configuration
      ...config
    });
  }
  
  // Add your specific methods
  createUser(userData) {
    // Implementation
  }
}
```

### **Step 3: Follow Naming Conventions**
- **Files**: `kebab-case.js` (e.g., `user-management.js`)
- **Classes**: `PascalCase` (e.g., `UserManagement`)
- **Methods**: `camelCase` (e.g., `createUser`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_CONFIG`)

## 📝 **Template Customization Guide**

### **1. Replace Placeholders**
```javascript
// Find and replace these placeholders:
ModuleName → YourModuleName
ApiModuleName → YourApiModuleName
FormModuleName → YourFormModuleName
ModalModuleName → YourModalModuleName
DataTableModuleName → YourDataTableModuleName
```

### **2. Add Configuration**
```javascript
constructor(config = {}) {
  this.config = {
    // Default configuration
    option1: 'default',
    option2: true,
    option3: 100,
    // Your specific options
    ...config
  };
}
```

### **3. Implement Core Methods**
```javascript
init() {
  // Your initialization logic
  this.setupEventListeners();
  this.initializeComponents();
  return true;
}

destroy() {
  // Your cleanup logic
  this.removeEventListeners();
  this.cleanupResources();
}
```

### **4. Add Your Methods**
```javascript
// Add your specific functionality
yourMethod(param1, param2) {
  // Implementation
}

anotherMethod() {
  // Implementation
}
```

## 🎯 **Best Practices**

### **1. Documentation**
```javascript
/**
 * Your method description
 * @param {string} param1 - Description of param1
 * @param {Object} param2 - Description of param2
 * @returns {Promise<boolean>} Success status
 */
async yourMethod(param1, param2) {
  // Implementation
}
```

### **2. Error Handling**
```javascript
try {
  // Your logic
} catch (error) {
  window.Utils?.handleError(error, 'YourModule Method');
  return false;
}
```

### **3. Configuration**
```javascript
// Make modules configurable
constructor(config = {}) {
  this.config = {
    // Sensible defaults
    defaultOption: 'value',
    // Override with user config
    ...config
  };
}
```

### **4. Event Handling**
```javascript
// Use event delegation for better performance
document.addEventListener('click', (e) => {
  if (e.target.matches('.your-selector')) {
    this.handleClick(e);
  }
});
```

## 🔧 **Template Features**

### **Common Features Across All Templates**
- ✅ **JSDoc Documentation** - Comprehensive documentation
- ✅ **Error Handling** - Consistent error handling
- ✅ **Configuration** - Configurable options
- ✅ **Lifecycle Methods** - init(), destroy()
- ✅ **Event Handling** - Proper event management
- ✅ **Performance** - Optimized for performance

### **Template-Specific Features**
- **API Template**: Retry logic, interceptors, authentication
- **Form Template**: Validation, error display, loading states
- **Modal Template**: Animation, focus trap, keyboard navigation
- **Data Table**: Sorting, filtering, pagination, search

## 📚 **Examples**

### **Creating a User Module**
```javascript
// Copy module-template.js
// Replace [ModuleName] with UserManagement
// Add your methods:

class UserManagement {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: '/api/users/',
      ...config
    };
  }

  async createUser(userData) {
    // Implementation
  }

  async updateUser(id, userData) {
    // Implementation
  }

  async deleteUser(id) {
    // Implementation
  }
}
```

### **Creating a Form Module**
```javascript
// Copy form-module-template.js
// Replace [FormModuleName] with ContactForm
// Add your validation rules:

class ContactForm {
  constructor(config = {}) {
    super({
      submitEndpoint: '/api/contact/',
      validationRules: {
        name: { required: true, minLength: 2 },
        email: { required: true, email: true },
        message: { required: true, minLength: 10 }
      },
      ...config
    });
  }
}
```

## 🚀 **Getting Started**

1. **Choose a template** that matches your needs
2. **Copy the template** to your modules directory
3. **Replace placeholders** with your specific names
4. **Add your functionality** following the patterns
5. **Test thoroughly** to ensure everything works
6. **Document your changes** for future reference

## 📞 **Support**

For questions about using these templates:
1. Check this README first
2. Look at existing modules for examples
3. Follow the established patterns
4. Ask the development team

---

*These templates are designed to accelerate development while maintaining consistency across the project.*
