// Modern JavaScript for Manheim Consulting website
class ManheimConsulting {
  constructor() {
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupSmoothScrolling();
    this.setupFormHandling();
    this.setupScrollAnimations();
    this.setupNavbarScroll();
    this.updateCurrentYear();
  }

  // Mobile menu functionality
  setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const mobileMenuClose = document.getElementById('mobile-menu-close');

    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('translate-x-0');
        
        if (isOpen) {
          mobileMenu.classList.remove('translate-x-0');
          mobileMenu.classList.add('translate-x-full');
          mobileMenuIcon.classList.remove('hidden');
          mobileMenuClose.classList.add('hidden');
        } else {
          mobileMenu.classList.remove('translate-x-full');
          mobileMenu.classList.add('translate-x-0');
          mobileMenuIcon.classList.add('hidden');
          mobileMenuClose.classList.remove('hidden');
        }
      });

      // Close mobile menu when clicking on links
      const mobileLinks = mobileMenu.querySelectorAll('a');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('translate-x-0');
          mobileMenu.classList.add('translate-x-full');
          mobileMenuIcon.classList.remove('hidden');
          mobileMenuClose.classList.add('hidden');
        });
      });
    }
  }

  // Smooth scrolling for anchor links
  setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          const headerOffset = 80;
          const elementPosition = targetElement.offsetTop;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Form handling with modern fetch API
  setupFormHandling() {
    const form = document.getElementById('contact-form');
    
    if (form) {
      console.log('Form found, setting up event listener');
      
      // Remove any action attribute to prevent fallback submission
      form.removeAttribute('action');
      form.removeAttribute('method');
      
      form.addEventListener('submit', async (e) => {
        console.log('Form submitted, preventing default');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Double-check to prevent any form submission
        if (e.defaultPrevented) {
          console.log('Default successfully prevented');
        }
        
        // Ensure no URL changes or query parameters
        if (window.location.search) {
          console.warn('Unexpected query parameters detected, clearing...');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Basic validation
        if (!this.validateForm(data)) {
          return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
          submitButton.disabled = true;
          submitButton.textContent = 'Sending...';
          
          console.log('Submitting to Formspree...');
          // Send to Formspree
          await this.submitToFormspree(formData);
          
          console.log('Form submitted successfully');
          this.showFormSuccess();
          form.reset();
          
        } catch (error) {
          console.error('Form submission error:', error);
          this.showFormError('There was an error sending your message. Please try again.');
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      });
    }
  }

  // Form validation
  validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!data.message || data.message.trim().length < 10) {
      errors.push('Message must be at least 10 characters long');
    }
    
    if (errors.length > 0) {
      this.showFormError(errors.join('. '));
      return false;
    }
    
    return true;
  }

  // Email validation
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Submit form to Formspree
  async submitToFormspree(formData) {
    console.log('Making request to Formspree...');
    console.log('Form data being sent via POST body (not URL):');
    
    // Log form data for debugging (without exposing sensitive info in production)
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value.length > 50 ? value.substring(0, 50) + '...' : value}`);
    }
    
    const response = await fetch('https://formspree.io/f/xjkrepbw', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('URL after submission:', window.location.href);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Formspree error:', error);
      throw new Error(error.message || 'Failed to send message');
    }

    const result = await response.json();
    console.log('Formspree response:', result);
    return result;
  }

  // Show form success message
  showFormSuccess() {
    this.showNotification('Thank you! Your message has been sent successfully.', 'success');
  }

  // Show form error message
  showFormError(message) {
    this.showNotification(message, 'error');
  }

  // Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }

  // Scroll animations using Intersection Observer
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements with animation classes
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
  }

  // Navbar scroll effect
  setupNavbarScroll() {
    const navbar = document.getElementById('navbar');
    
    if (navbar) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
          navbar.classList.add('shadow-md');
        } else {
          navbar.classList.remove('shadow-md');
        }
      });
    }
  }

  // Update current year in footer
  updateCurrentYear() {
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
      const currentYear = new Date().getFullYear();
      currentYearElement.textContent = currentYear;
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing ManheimConsulting...');
  new ManheimConsulting();
  console.log('ManheimConsulting initialized');
});

// Google Analytics (modern gtag)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-20085774-1'); 