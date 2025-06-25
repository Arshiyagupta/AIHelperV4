// Utility functions

export const utils = {
  // Format date for display
  formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return d.toLocaleDateString();
    }
  },

  // Format time for display
  formatTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },

  // Truncate text with ellipsis
  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  // Generate initials from name
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  },

  // Debounce function
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Generate random ID
  generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  // Check if string is empty or whitespace
  isEmpty(str: string): boolean {
    return !str || str.trim().length === 0;
  },

  // Capitalize first letter
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'in_progress':
        return '#F59E0B';
      case 'proposal_sent':
        return '#2563EB';
      case 'resolved':
        return '#10B981';
      case 'halted':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  },

  // Get status display text
  getStatusText(status: string): string {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'proposal_sent':
        return 'Proposal Ready';
      case 'resolved':
        return 'Resolved';
      case 'halted':
        return 'Halted';
      default:
        return 'Unknown';
    }
  },

  // Validate and format phone number
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  },

  // Check if running on web platform
  isWeb(): boolean {
    return typeof window !== 'undefined';
  },

  // Safe JSON parse
  safeJsonParse<T>(str: string, fallback: T): T {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }
};