import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Nav, Offcanvas } from 'react-bootstrap';
import { 
  FaArrowRight, FaCalendarCheck, FaUserMd, FaHospital, 
  FaPhone, FaBars, FaTimes, FaMapMarkerAlt, FaChevronDown,
  FaWhatsapp, FaEnvelope, FaAmbulance
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const HomeCroixBleue = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const backgroundImages = [
    'http://cliniquecroixbleue.com/img/cities/facadeclinique.jpg',
    'http://cliniquecroixbleue.com/Source/images/cities/courinterieure.jpg',
    'http://cliniquecroixbleue.com/Source/images/cities/blocopperatoire.jpg',
    'http://cliniquecroixbleue.com/Source/images/cities/sallepediatrie.jpg',
    'http://cliniquecroixbleue.com/img/cities/pediatrie2.jpg',
    'http://cliniquecroixbleue.com/Source/images/cities/couveuse.jpg'
  ];

  const services = [
    { name: 'Accouchement', icon: '👶', description: 'Service complet de maternité avec suivi prénatal et postnatal' },
    { name: 'Cancérologie', icon: '🔬', description: 'Traitement et suivi des pathologies cancéreuses' },
    { name: 'Pédiatrie', icon: '🧒', description: 'Soins spécialisés pour enfants et nourrissons' },
    { name: 'Dépistage', icon: '🩺', description: 'Examens préventifs et diagnostics précoces' },
    { name: 'Cardiologie', icon: '❤️', description: 'Prise en charge des maladies cardiovasculaires' },
    { name: 'Urgences', icon: '🚑', description: 'Service d\'urgence disponible 24h/24 et 7j/7' }
  ];

  const features = [
    { 
      title: 'Professionnels qualifiés', 
      icon: <FaUserMd />, 
      description: 'Accès à une équipe médicale hautement qualifiée et expérimentée'
    },
    { 
      title: 'Rendez-vous faciles', 
      icon: <FaCalendarCheck />, 
      description: 'Système de prise de rendez-vous en ligne simple et rapide'
    },
    { 
      title: 'Équipement moderne', 
      icon: <FaHospital />, 
      description: 'Technologies médicales de pointe pour des diagnostics précis'
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    
    if (swipeDistance > minSwipeDistance) {
      // Swipe left - next image
      setCurrentImageIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    } else if (swipeDistance < -minSwipeDistance) {
      // Swipe right - previous image
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? backgroundImages.length - 1 : prevIndex - 1
      );
    }
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className={`HomeCroixBleue-wrapper ${isLoaded ? 'loaded' : ''}`}>
      <header className={`site-header ${scrollPosition > 50 ? 'scrolled' : ''}`}>
        <div className="logo-container">
          <div className="logo">
            <span className="logo-icon">+</span>
            <span className="logo-text">CROIX BLEUE</span>
          </div>
        </div>
        
        {isMobile ? (
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setShowMenu(true)}
            aria-label="Menu"
          >
            <FaBars />
          </button>
        ) : (
          <Nav className="header-nav">
            <Nav.Link href="#services">Services</Nav.Link>
            <Nav.Link href="#about">À propos</Nav.Link>
            <Nav.Link href="#contact">Contact</Nav.Link>
            <Button 
              variant="outline-light" 
              className="nav-button"
              onClick={() => navigate('/auth-croix-bleue')}
            >
              Connexion
            </Button>
          </Nav>
        )}
      </header>

      <Offcanvas show={showMenu} onHide={() => setShowMenu(false)} placement="end" className="mobile-menu">
        <Offcanvas.Header>
          <div className="logo">
            <span className="logo-icon">+</span>
            <span className="logo-text">CROIX BLEUE</span>
          </div>
          <Button 
            variant="link" 
            className="close-menu" 
            onClick={() => setShowMenu(false)}
          >
            <FaTimes />
          </Button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="mobile-nav">
            <Nav.Link href="#services" onClick={() => setShowMenu(false)}>Services</Nav.Link>
            <Nav.Link href="#about" onClick={() => setShowMenu(false)}>À propos</Nav.Link>
            <Nav.Link href="#contact" onClick={() => setShowMenu(false)}>Contact</Nav.Link>
            <Button 
              variant="primary" 
              className="w-100 mt-3"
              onClick={() => {
                setShowMenu(false);
                navigate('/auth-croix-bleue');
              }}
            >
              Connexion / Inscription
            </Button>
          </div>
          
          <div className="mobile-quick-contact">
            <h5>Contact rapide</h5>
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <span>+123 456 7890</span>
            </div>
            <div className="contact-item emergency">
              <FaAmbulance className="contact-icon" />
              <div>
                <span className="emergency-label">URGENCES</span>
                <span className="emergency-number">+123 789 4560</span>
              </div>
            </div>
            <div className="contact-item">
              <FaWhatsapp className="contact-icon" />
              <span>+123 456 7890</span>
            </div>
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <span>contact@croixbleue.com</span>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <Container fluid className="min-vh-100 HomeCroixBleue-container p-0">
        <div 
          className="hero-slider"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="background-overlay"></div>
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`background-image ${currentImageIndex === index ? 'active' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
          
          <div className="slide-indicators">
            {backgroundImages.map((_, index) => (
              <div 
                key={index} 
                className={`indicator ${currentImageIndex === index ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
          
          <Row className="h-100 m-0 position-relative main-content">
            <Col xs={12} lg={8} className="hero-content d-flex flex-column justify-content-center p-4 p-md-5">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="welcome-text"
              >
                <h1 className="hero-title">
                  <span className="welcome-line">Bienvenue à la</span>
                  <span className="clinic-name">CLINIQUE CROIX BLEUE</span>
                </h1>
                <p className="lead hero-subtitle">
                  Au service de vos familles depuis 1964
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="features-container"
              >
                {features.map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="feature-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.2, duration: 0.5 }}
                  >
                    <div className="feature-icon">{feature.icon}</div>
                    <div>
                      <p className="feature-title">{feature.title}</p>
                      {!isMobile && <p className="feature-description">{feature.description}</p>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              >
                <Button 
                  size="lg" 
                  className="start-button"
                  onClick={() => navigate('/auth-croix-bleue')}
                >
                  Prendre rendez-vous <FaArrowRight className="ms-2" />
                </Button>
              </motion.div>
            </Col>
          </Row>
        </div>

        <div className="content-sections">
          <section id="services" className="services-section">
            <Container>
              <div className="section-header">
                <h2>Nos services médicaux</h2>
                <p>Des soins de qualité adaptés à tous vos besoins</p>
              </div>
              
              <Row xs={1} sm={2} lg={3} className="g-4">
                {services.map((service, index) => (
                  <Col key={index}>
                    <motion.div 
                      className="service-card"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="service-icon">{service.icon}</div>
                      <h3 className="service-name">{service.name}</h3>
                      <p className="service-description">{service.description}</p>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </Container>
          </section>

          <section id="about" className="about-section">
            <Container>
              <div className="section-header">
                <h2>À propos de nous</h2>
                <p>Une histoire d'excellence et d'engagement</p>
              </div>
              
              <Row className="align-items-center">
                <Col md={6}>
                  <motion.div 
                    className="about-image"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  >
                    <img 
                      src="http://cliniquecroixbleue.com/img/cities/facadeclinique.jpg" 
                      alt="Clinique Croix Bleue" 
                      className="img-fluid rounded shadow"
                    />
                  </motion.div>
                </Col>
                <Col md={6}>
                  <motion.div 
                    className="about-content"
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                  >
                    <h3>Notre mission</h3>
                    <p>
                      Depuis 1964, la Clinique Croix Bleue s'engage à fournir des soins médicaux 
                      de la plus haute qualité à nos patients. Notre équipe de professionnels dévoués 
                      travaille sans relâche pour assurer votre bien-être et celui de votre famille.
                    </p>
                    
                    <div className="accordion-section">
                      <div 
                        className={`accordion-item ${activeSection === 'history' ? 'active' : ''}`}
                        onClick={() => toggleSection('history')}
                      >
                        <div className="accordion-header">
                          <h4>Notre histoire</h4>
                          <FaChevronDown className="accordion-icon" />
                        </div>
                        <AnimatePresence>
                          {activeSection === 'history' && (
                            <motion.div 
                              className="accordion-content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <p>
                                Fondée en 1964, la Clinique Croix Bleue a commencé comme un petit 
                                centre médical et s'est développée pour devenir l'établissement 
                                de premier plan que nous connaissons aujourd'hui. À travers les décennies, 
                                nous avons constamment évolué pour intégrer les avancées médicales 
                                tout en préservant notre engagement envers des soins personnalisés.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div 
                        className={`accordion-item ${activeSection === 'values' ? 'active' : ''}`}
                        onClick={() => toggleSection('values')}
                      >
                        <div className="accordion-header">
                          <h4>Nos valeurs</h4>
                          <FaChevronDown className="accordion-icon" />
                        </div>
                        <AnimatePresence>
                          {activeSection === 'values' && (
                            <motion.div 
                              className="accordion-content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ul>
                                <li>Excellence dans les soins médicaux</li>
                                <li>Compassion et respect envers chaque patient</li>
                                <li>Intégrité et éthique professionnelle</li>
                                <li>Innovation et amélioration continue</li>
                                <li>Accessibilité des soins pour tous</li>
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div 
                        className={`accordion-item ${activeSection === 'team' ? 'active' : ''}`}
                        onClick={() => toggleSection('team')}
                      >
                        <div className="accordion-header">
                          <h4>Notre équipe</h4>
                          <FaChevronDown className="accordion-icon" />
                        </div>
                        <AnimatePresence>
                          {activeSection === 'team' && (
                            <motion.div 
                              className="accordion-content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <p>
                                Notre équipe comprend des médecins spécialistes, des infirmiers qualifiés, 
                                des techniciens et du personnel administratif dévoué. Tous partagent 
                                un engagement commun : vous offrir les meilleurs soins possibles dans 
                                un environnement accueillant et professionnel.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                </Col>
              </Row>
            </Container>
          </section>

          <section id="contact" className="contact-section">
            <Container>
              <div className="section-header">
                <h2>Nous contacter</h2>
                <p>Nous sommes à votre écoute</p>
              </div>
              
              <Row className="g-4">
                <Col md={6}>
                  <motion.div 
                    className="contact-info"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3>Coordonnées</h3>
                    <div className="contact-item">
                      <FaPhone className="contact-icon" />
                      <span>+(221)338245182</span>
                    </div>
                    <div className="contact-item emergency">
                      <FaAmbulance className="contact-icon" />
                      <div>
                        <span className="emergency-label">URGENCES</span>
                        <span className="emergency-number">+(221)338245182</span>
                      </div>
                    </div>
                    <div className="contact-item">
                      <FaEnvelope className="contact-icon" />
                      <span>info@cliniquecroixbleue.com
                      </span>
                    </div>
                    <div className="contact-item">
                      <FaMapMarkerAlt className="contact-icon" />
                      <span>Clinique Croix Bleue - Partenaire AfriDoctor, Av.El Hadj Mansour Sy., Dakar</span>
                    </div>
                    
                    <div className="opening-hours mt-4">
                      <h4>Horaires d'ouverture</h4>
                      <div className="hours-item">
                        <span className="day">Lundi - Vendredi:</span>
                        <span className="time">8h00 - 20h00</span>
                      </div>
                      <div className="hours-item">
                        <span className="day">Samedi:</span>
                        <span className="time">9h00 - 18h00</span>
                      </div>
                      <div className="hours-item">
                        <span className="day">Dimanche:</span>
                        <span className="time">9h00 - 13h00</span>
                      </div>
                      <div className="hours-item emergency">
                        <span className="day">Urgences:</span>
                        <span className="time">24h/24, 7j/7</span>
                      </div>
                    </div>
                  </motion.div>
                </Col>
                
                <Col md={6}>
                  <motion.div 
                    className="map-container"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="map-placeholder">
                      <FaMapMarkerAlt className="map-marker" />
                      <p>Carte interactive</p>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      className="mt-3 w-100"
                      onClick={() => window.open('https://maps.google.com', '_blank')}
                    >
                      Voir sur Google Maps
                    </Button>
                  </motion.div>
                </Col>
              </Row>
            </Container>
          </section>
        </div>

        <div className="cta-section">
          <Container>
            <Row className="justify-content-center">
              <Col md={10} lg={8}>
                <motion.div 
                  className="cta-content text-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <h2>Votre santé est notre priorité</h2>
                  <p>
                    Prenez rendez-vous dès aujourd'hui et bénéficiez de l'expertise 
                    de nos professionnels de santé
                  </p>Clinique Croix Bleue - Partenaire AfriDoctor, Av.El Hadj Mansour Sy., Dakar
                  <Button 
                    size="lg" 
                    className="cta-button"
                    onClick={() => navigate('/auth-croix-bleue')}
                  >
                    Prendre rendez-vous <FaArrowRight className="ms-2" />
                  </Button>
                </motion.div>
              </Col>
            </Row>
          </Container>
        </div>

        <footer className="site-footer">
          <Container>
            <Row className="gy-4">
              <Col md={4}>
                <div className="footer-logo">
                  <span className="logo-icon">+</span>
                  <span className="logo-text">CROIX BLEUE</span>
                </div>
                <p className="footer-tagline">
                  Au service de vos familles depuis 1964
                </p>
              </Col>
              
              <Col md={4}>
                <h5>Liens rapides</h5>
                <ul className="footer-links">
                  <li><a href="#services">Services</a></li>
                  <li><a href="#about">À propos</a></li>
                  <li><a href="#contact">Contact</a></li>
                  <li><a href="#" onClick={() => navigate('/auth-croix-bleue')}>Connexion</a></li>
                </ul>
              </Col>
              
              <Col md={4}>
                <h5>Contact d'urgence</h5>
                <div className="footer-emergency">+(221)338245182
                  <FaPhone className="footer-icon" />
                  <span className="emergency-number">+(221)338245182</span>
                </div>
                <p className="available-text">Disponible 24h/24, 7j/7</p>
              </Col>
            </Row>
            
            <hr className="footer-divider" />
            
            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} Clinique Croix Bleue. Tous droits réservés.développée par </p>

            </div>
          </Container>
        </footer>

        <div className="mobile-fab">
          <Button 
            className="fab-button emergency-call"
            onClick={() => window.location.href = 'tel:+(221)338245182'}
            aria-label="Appel d'urgence"
          >
            <FaPhone />
          </Button>
        </div>
      </Container>

      <style jsx>{`
        /* Base styles */
        :root {
          --primary-color: #4285f4;
          --secondary-color: #34a853;
          --accent-color: #ea4335;
          --dark-color: #1a1a1a;
          --light-color: #ffffff;
          --gray-color: #f5f5f5;
          --text-color: #333333;
          --transition-slow: 0.5s ease;
          --transition-medium: 0.3s ease;
          --transition-fast: 0.2s ease;
          --border-radius-sm: 5px;
          --border-radius-md: 10px;
          --border-radius-lg: 15px;
          --border-radius-xl: 30px;
          --box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .HomeCroixBleue-wrapper {
          opacity: 0;
          transition: opacity 1s ease-out;
        }
        
        .HomeCroixBleue-wrapper.loaded {
          opacity: 1;
        }
        
        /* Header Styles */
        .site-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          z-index: 1000;
          background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
          transition: all var(--transition-medium);
        }
        
        .site-header.scrolled {
          background: rgba(0,0,0,0.9);
          padding: 1rem 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        
        .logo-container {
          display: flex;
          align-items: center;
        }
        
        .logo {
          display: flex;
          align-items: center;
          color: white;
          font-weight: bold;
        }
        
        .logo-icon {
          font-size: 1.5rem;
          color: var(--primary-color);
          margin-right: 0.5rem;
          background: white;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(66, 133, 244, 0.3);
        }
        
        .logo-text {
          font-size: 1.2rem;
          letter-spacing: 1px;
        }
        
        .header-nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .header-nav a {
          color: white;
          text-decoration: none;
          font-weight: 500;
          position: relative;
          padding: 0.5rem 0;
        }
        
        .header-nav a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: white;
          transition: width var(--transition-medium);
        }
        
        .header-nav a:hover::after {
          width: 100%;
        }
        
        .nav-button {
          border-radius: var(--border-radius-xl);
          padding: 0.5rem 1.5rem;
          border: 2px solid white;
          transition: all var(--transition-medium);
        }
        
        .nav-button:hover {
          background-color: white;
          color: var(--primary-color);
        }
        
        .mobile-menu-toggle {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: all var(--transition-fast);
        }
        
        .mobile-menu-toggle:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        /* Mobile Menu */
        .mobile-menu {
          background-color: var(--dark-color);
          color: var(--light-color);
          width: 85% !important;
          max-width: 350px;
        }
        
               /* Mobile Menu (suite) */
        .mobile-menu .offcanvas-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1.5rem;
        }
        
        .close-menu {
          color: white;
          font-size: 1.5rem;
          padding: 0;
        }
        
        .mobile-nav {
          display: flex;
          flex-direction: column;
          margin-bottom: 2rem;
        }
        
        .mobile-nav a {
          color: white;
          text-decoration: none;
          font-weight: 500;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all var(--transition-fast);
        }
        
        .mobile-nav a:hover {
          padding-left: 0.5rem;
          color: var(--primary-color);
        }
        
        .mobile-quick-contact {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: var(--border-radius-md);
          padding: 1.5rem;
        }
        
        .mobile-quick-contact h5 {
          margin-bottom: 1rem;
          font-size: 1.1rem;
          color: var(--primary-color);
        }
        
        /* Hero Slider */
        .hero-slider {
          position: relative;
          height: 100vh;
          overflow: hidden;
        }
        
        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity 1.5s ease-in-out, transform 8s ease-in-out;
          transform: scale(1.05);
        }
        
        .background-image.active {
          opacity: 1;
          transform: scale(1);
        }

        .background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.7) 40%,
            rgba(0, 0, 0, 0.5) 100%
          );
          z-index: 1;
        }
        
        .slide-indicators {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          z-index: 10;
        }
        
        .indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all var(--transition-medium);
        }
        
        .indicator.active {
          background-color: white;
          transform: scale(1.2);
        }

        .main-content {
          z-index: 2;
        }
        
        .hero-content {
          color: white;
          padding-top: 80px;
        }
        
        .welcome-text {
          margin-bottom: 2rem;
        }
        
        .hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
        }
        
        .welcome-line {
          font-weight: 300;
          font-size: 1.8rem;
        }
        
        .clinic-name {
          color: var(--primary-color);
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .hero-subtitle {
          font-size: 1.2rem;
          font-weight: 300;
          margin-top: 0.5rem;
        }

        .features-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .feature-icon {
          font-size: 1.2rem;
          color: var(--primary-color);
          background-color: rgba(255, 255, 255, 0.2);
          padding: 0.75rem;
          border-radius: 50%;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 45px;
          min-height: 45px;
        }
        
        .feature-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }
        
        .feature-description {
          font-size: 0.9rem;
          margin: 0;
          opacity: 0.8;
        }

        .start-button {
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: var(--border-radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-medium);
          box-shadow: 0 4px 15px rgba(66, 133, 244, 0.4);
          width: 100%;
          margin-top: 1rem;
        }

        .start-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(66, 133, 244, 0.6);
          background: linear-gradient(135deg, #3b78e7, #2d9348);
        }
        
        /* Content Sections */
        .content-sections {
          background-color: var(--light-color);
          position: relative;
          z-index: 3;
        }
        
        .section-header {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
          padding-bottom: 1.5rem;
        }
        
        .section-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
          border-radius: 3px;
        }
        
        .section-header h2 {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--dark-color);
          margin-bottom: 0.5rem;
        }
        
        .section-header p {
          font-size: 1.1rem;
          color: #666;
        }
        
        /* Services Section */
        .services-section {
          padding: 5rem 0;
        }
        
        .service-card {
          background-color: white;
          border-radius: var(--border-radius-md);
          padding: 2rem;
          text-align: center;
          transition: all var(--transition-medium);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          height: 100%;
          border: 1px solid #eee;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .service-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
          border-color: var(--primary-color);
        }
        
        .service-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          background-color: rgba(66, 133, 244, 0.1);
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all var(--transition-medium);
        }
        
        .service-card:hover .service-icon {
          transform: scale(1.1);
          background-color: rgba(66, 133, 244, 0.2);
        }
        
        .service-name {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--dark-color);
        }
        
        .service-description {
          color: #666;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }
        
        /* About Section */
        .about-section {
          padding: 5rem 0;
          background-color: var(--gray-color);
        }
        
        .about-image {
          position: relative;
          margin-bottom: 2rem;
        }
        
        .about-image::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 3px solid var(--primary-color);
          border-radius: var(--border-radius-md);
          z-index: -1;
        }
        
        .about-content h3 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--dark-color);
        }
        
        .about-content p {
          color: #555;
          line-height: 1.7;
          margin-bottom: 2rem;
        }
        
        .accordion-section {
          margin-top: 2rem;
        }
        
        .accordion-item {
          border: 1px solid #ddd;
          border-radius: var(--border-radius-sm);
          margin-bottom: 1rem;
          overflow: hidden;
        }
        
        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background-color: white;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .accordion-item.active .accordion-header {
          background-color: var(--primary-color);
          color: white;
        }
        
        .accordion-header h4 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .accordion-icon {
          transition: transform var(--transition-medium);
        }
        
        .accordion-item.active .accordion-icon {
          transform: rotate(180deg);
        }
        
        .accordion-content {
          background-color: white;
          padding: 0 1.5rem;
          overflow: hidden;
        }
        
        .accordion-content p, .accordion-content ul {
          padding: 1rem 0;
          margin: 0;
          color: #555;
        }
        
        .accordion-content ul {
          padding-left: 1.5rem;
        }
        
        .accordion-content li {
          margin-bottom: 0.5rem;
        }
        
        /* Contact Section */
        .contact-section {
          padding: 5rem 0;
        }
        
        .contact-info h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--dark-color);
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.2rem;
          color: #555;
        }
        
        .contact-icon {
          color: var(--primary-color);
          font-size: 1.2rem;
        }
        
        .emergency {
          background-color: rgba(234, 67, 53, 0.1);
          padding: 0.8rem;
          border-radius: var(--border-radius-md);
          margin: 1.5rem 0;
        }
        
        .emergency .contact-icon {
          color: var(--accent-color);
        }
        
        .emergency-label {
          display: block;
          font-weight: 600;
          color: var(--accent-color);
          font-size: 0.9rem;
        }
        
        .emergency-number {
          font-weight: 700;
          font-size: 1.2rem;
          color: var(--dark-color);
        }
        
        .opening-hours {
          background-color: white;
          border-radius: var(--border-radius-md);
          padding: 1.5rem;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }
        
        .opening-hours h4 {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--dark-color);
        }
        
        .hours-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.8rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid #eee;
        }
        
        .hours-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .hours-item.emergency .day {
          color: var(--accent-color);
          font-weight: 600;
        }
        
        .hours-item.emergency .time {
          color: var(--accent-color);
          font-weight: 600;
        }
        
        .day {
          font-weight: 500;
        }
        
        .map-container {
          height: 100%;
          min-height: 300px;
        }
        
        .map-placeholder {
          height: 300px;
          background-color: #e9ecef;
          border-radius: var(--border-radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #6c757d;
        }
        
        .map-marker {
          font-size: 3rem;
          color: var(--primary-color);
          margin-bottom: 1rem;
        }
        
        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, var(--primary-color), #1a73e8);
          padding: 5rem 0;
          color: white;
        }
        
        .cta-content h2 {
          font-size: 2.2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .cta-content p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        
        .cta-button {
          background-color: white;
          color: var(--primary-color);
          border: none;
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: var(--border-radius-xl);
          display: inline-flex;
          align-items: center;
          transition: all var(--transition-medium);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          background-color: #f8f9fa;
        }
        
        /* Footer */
        .site-footer {
          background-color: var(--dark-color);
          color: white;
          padding: 4rem 0 2rem;
        }
        
        .footer-logo {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .footer-tagline {
          opacity: 0.7;
          margin-bottom: 0;
        }
        
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-links li {
          margin-bottom: 0.8rem;
        }
        
        .footer-links a {
          color: white;
          opacity: 0.7;
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        
        .footer-links a:hover {
          opacity: 1;
          color: var(--primary-color);
        }
        
        .footer-emergency {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .footer-icon {
          color: var(--accent-color);
        }
        
        .available-text {
          opacity: 0.7;
          font-size: 0.9rem;
        }
        
        .footer-divider {
          border-color: rgba(255, 255, 255, 0.1);
          margin: 2rem 0;
        }
        
        .footer-bottom {
          text-align: center;
          opacity: 0.7;
          font-size: 0.9rem;
        }
        
        /* Mobile FAB */
        .mobile-fab {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999;
          display: none;
        }
        
        .fab-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          transition: all var(--transition-medium);
        }
        
        .emergency-call {
          background-color: var(--accent-color);
          color: white;
          border: none;
        }
        
        .emergency-call:hover {
          transform: scale(1.1);
          background-color: #d93025;
        }
        
        /* Media Queries */
        @media (max-width: 991px) {
          .hero-title {
            font-size: 2.2rem;
          }
          
          .welcome-line {
            font-size: 1.6rem;
          }
          
          .hero-subtitle {
            font-size: 1.1rem;
          }
          
          .site-header {
            padding: 1rem;
          }
        }
        
        @media (max-width: 767px) {
          .hero-content {
            padding: 1.5rem !important;
            padding-top: 100px !important;
          }
          
          .hero-title {
            font-size: 1.8rem;
          }
          
          .welcome-line {
            font-size: 1.4rem;
          }
          
          .section-header h2 {
            font-size: 1.8rem;
          }
          
          .about-image::before {
            display: none;
          }
          
          .cta-content h2 {
            font-size: 1.8rem;
          }
          
          .mobile-fab {
            display: block;
          }
          
          .services-section, .about-section, .contact-section {
            padding: 3rem 0;
          }
        }
        
        @media (max-width: 575px) {
          .hero-title {
            font-size: 1.6rem;
          }
          
          .welcome-line {
            font-size: 1.2rem;
          }
          
          .feature-icon {
            min-width: 40px;
            min-height: 40px;
            padding: 0.6rem;
            font-size: 1rem;
          }
          
          .feature-title {
            font-size: 0.9rem;
          }
          
          .start-button {
            padding: 0.8rem 1.5rem;
            font-size: 1rem;
          }
          
          .section-header {
            margin-bottom: 2rem;
          }
          
          .section-header h2 {
            font-size: 1.6rem;
          }
          
          .service-icon {
            width: 60px;
            height: 60px;
            font-size: 2.5rem;
          }
          
          .service-name {
            font-size: 1.1rem;
          }
          
          .cta-content h2 {
            font-size: 1.5rem;
          }
          
          .cta-content p {
            font-size: 1rem;
          }
          
          .cta-button {
            padding: 0.8rem 1.5rem;
            font-size: 1rem;
          }
          
          .slide-indicators {
            bottom: 10px;
          }
          
          .indicator {
            width: 8px;
            height: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default HomeCroixBleue;
