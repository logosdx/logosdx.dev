import { $, html } from '@logosdx/dom';

/**
 * Home page specific behaviors and enhancements.
 * Handles smooth scrolling and interactive elements.
 */
export const bindHome = () => {

    // Handle smooth scroll for anchor links
    const anchorLinks = $('a[href^="#"]');
    
    anchorLinks.forEach((link) => {
        
        html.events.on(link, 'click', (evt) => {
            
            evt.preventDefault();
            
            const href = (link as HTMLAnchorElement).getAttribute('href');
            
            if (!href || href === '#') return;
            
            const target = $(href.substring(1));
            
            if (target.length === 0) return;
            
            const [targetElement] = target;
            
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    // Add hover animations to package cards
    const packageCards = $('.package-card');
    
    packageCards.forEach((card) => {
        
        let timeout: number;
        
        html.events.on(card, 'mouseenter', () => {
            
            clearTimeout(timeout);
            
            html.css.set(card as HTMLElement, {
                transform: 'translateY(-4px)',
                transition: 'all 0.3s ease'
            });
        });
        
        html.events.on(card, 'mouseleave', () => {
            
            timeout = setTimeout(() => {
                
                html.css.set(card as HTMLElement, {
                    transform: 'translateY(0)',
                    transition: 'all 0.3s ease'
                });
            }, 100);
        });
    });

    // Enhanced copy button feedback for home page
    const copyButtons = $('.copy-button');
    
    copyButtons.forEach((button) => {
        
        html.events.on(button, 'click', () => {
            
            const originalText = button.textContent;
            
            button.textContent = 'Copied!';
            
            html.css.set(button as HTMLElement, {
                background: '#22c55e',
                color: 'white',
                borderColor: '#22c55e'
            });
            
            setTimeout(() => {
                
                button.textContent = originalText;
                
                html.css.set(button as HTMLElement, {
                    background: 'white',
                    color: '',
                    borderColor: ''
                });
            }, 1500);
        });
    });

    // Handle CTA button analytics (placeholder for future implementation)
    const ctaButtons = $('.hero .btn, .final-cta .btn');
    
    ctaButtons.forEach((button) => {
        
        html.events.on(button, 'click', () => {
            
            // Placeholder for analytics tracking
            const buttonText = button.textContent?.trim();
            const section = button.closest('section')?.className || 'unknown';
            
            // In a real implementation, you'd send this to your analytics service
            console.log(`CTA clicked: "${buttonText}" in section: ${section}`);
        });
    });
}