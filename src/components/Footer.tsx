import { Brain, Cloud, Users, Linkedin, Github, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/in/sethgagnon',
      icon: Linkedin
    },
    {
      name: 'GitHub',
      href: 'https://github.com/sethgagnon',
      icon: Github
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/sethgagnon',
      icon: Twitter
    },
    {
      name: 'Email',
      href: 'mailto:seth@aicloudops.tech',
      icon: Mail
    }
  ];

  const footerLinks = [
    {
      title: 'Content',
      links: [
        { name: 'Blog', href: '/blog' },
        
        { name: 'Media Kit', href: '/about#media' }
      ]
    },
    {
      title: 'Connect',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'LinkedIn', href: 'https://linkedin.com/in/sethgagnon' }
      ]
    },
    {
      title: 'Topics',
      links: [
        { name: 'AI Leadership', href: '/blog?tag=AI' },
        { name: 'Cloud Strategy', href: '/blog?tag=Cloud' },
        { name: 'Team Leadership', href: '/blog?tag=Leadership' }
      ]
    }
  ];

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4 group">
              <div className="flex items-center space-x-1">
                <Brain className="h-6 w-6 text-primary-foreground" />
                <Cloud className="h-6 w-6 text-accent" />
                <Users className="h-6 w-6 text-primary-glow" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-secondary-foreground group-hover:text-primary-foreground transition-colors duration-300">
                  AI Cloud Ops
                </span>
                <span className="text-sm text-secondary-foreground/70 -mt-1">
                  Insights on AI, Cloud, and Leadership
                </span>
              </div>
            </Link>
            
            <p className="text-secondary-foreground/80 mb-6 max-w-md">
              Expert insights and practical strategies for leading AI adoption, 
              cloud transformation, and building high-performance engineering teams.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 bg-secondary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold text-secondary-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.href.startsWith('http') ? (
                      <a
                        href={link.href}
                        className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors duration-300"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors duration-300"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Bottom */}
        <div className="py-8 border-t border-secondary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-secondary-foreground/60 text-sm mb-4 md:mb-0">
              © {currentYear} Seth Gagnon. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-secondary-foreground/60">
              <Link to="/privacy" className="hover:text-secondary-foreground transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-secondary-foreground transition-colors duration-300">
                Terms of Use
              </Link>
              <span>Built with ❤️ and modern tech</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;