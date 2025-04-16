import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Nav, Offcanvas, Card } from 'react-bootstrap';
import { 
  FaArrowRight, FaCalendarCheck, FaUserMd, FaHospital, 
  FaPhone, FaBars, FaTimes, FaMapMarkerAlt, FaChevronDown,
  FaWhatsapp, FaEnvelope, FaAmbulance, FaSearch, FaBuilding
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const PlatformHome = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStructures, setFilteredStructures] = useState([]);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const backgroundImages = [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1631815588090-d1bcbe9a8545?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1504439468489-c8920d796a29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80'
  ];

  const medicalStructures = [
    {
      id: 'clinique-croix-bleue',
      name: 'Clinique Croix Bleue',
      location: 'Dakar, Sénégal',
      image: 'http://cliniquecroixbleue.com/img/cities/facadeclinique.jpg',
      specialty: 'Clinique polyvalente',
      description: 'Au service de vos familles depuis 1964, la Clinique Croix Bleue offre des soins médicaux de qualité dans un environnement moderne et accueillant.',
      rating: 4.8,
      reviews: 124
    },
    {
      id: 'HopitalGeneral',
      name: 'Hôpital Principal',
      location: 'Dakar, Sénégal',
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80',
      specialty: 'Hôpital militaire',
      description: 'Centre hospitalier de référence offrant des soins de haute qualité avec des équipements modernes et une équipe médicale expérimentée.',
      rating: 4.6,
      reviews: 210
    },
    {
      id: 'cliniquesaintjean',
      name: 'Clinique Saint Jean',
      location: 'Thiès, Sénégal',
      image: 'https://images.unsplash.com/photo-1519494080410-f9aa76cb4283?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80',
      specialty: 'Maternité et pédiatrie',
      description: 'Spécialisée dans les soins maternels et infantiles, la Clinique Saint Jean propose un suivi complet de la grossesse et des soins pédiatriques.',
      rating: 4.7,
      reviews: 98
    },
    {
      id: 'centresante',
      name: 'Centre de Santé Keur Massar',
      location: 'Keur Massar, Dakar',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      specialty: 'Médecine générale',
      description: 'Centre de santé communautaire offrant des services médicaux essentiels et préventifs accessibles à tous.',
      rating: 4.3,
      reviews: 67
    },
    {
      id: 'cliniquediamnadio',
      name: 'Clinique de Diamnadio',
      location: 'Diamnadio, Sénégal',
      image: 'https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      specialty: 'Chirurgie et traumatologie',
      description: 'Établissement moderne spécialisé dans les interventions chirurgicales et la prise en charge des traumatismes.',
      rating: 4.5,
      reviews: 82
    },
    {
      id: 'hopitalmbour',
      name: 'Hôpital de Mbour',
      location: 'Mbour, Sénégal',
      image: 'https://images.unsplash.com/photo-1580281657702-257584239a42?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
      specialty: 'Hôpital général',
      description: 'Établissement hospitalier public offrant une gamme complète de services médicaux pour la population de Mbour et ses environs.',
      rating: 4.2,
      reviews: 145
    }
  ];

  const features = [
    { 
      title: 'Professionnels qualifiés', 
      icon: <FaUserMd />, 
      description: 'Accès à des équipes médicales hautement qualifiées dans toutes nos structures partenaires'
    },
    { 
      title: 'Rendez-vous faciles', 
      icon: <FaCalendarCheck />, 
      description: 'Système de prise de rendez-vous en ligne simple et rapide dans tous les établissements'
    },
    { 
      title: 'Structures diverses', 
      icon: <FaBuilding />, 
      description: 'Un large réseau d\'établissements médicaux pour répondre à tous vos besoins de santé'
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    setFilteredStructures(medicalStructures);
    
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

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStructures(medicalStructures);
    } else {
      const filtered = medicalStructures.filter(structure => 
        structure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        structure.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        structure.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStructures(filtered);
    }
  }, [searchTerm]);

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

  const handleStructureSelect = (structureId) => {
    // Ouverture des sites web externes pour chaque structure
    switch(structureId) {
      case 'clinique-croix-bleue':
        window.open('https://clinique-croix-bleue.vercel.app', '_blank');
        break;
      case 'HopitalGeneral':
        window.open('https://hopital-principal.sn', '_blank');
        break;
      case 'cliniquesaintjean':
        window.open('https://clinique-saint-jean.sn', '_blank');
        break;
      case 'centresante':
        window.open('https://centresante-keurmassar.sn', '_blank');
        break;
      case 'cliniquediamnadio':
        window.open('https://clinique-diamnadio.sn', '_blank');
        break;
      case 'hopitalmbour':
        window.open('https://hopital-mbour.sn', '_blank');
        break;
      default:
        // Redirection par défaut si l'ID n'est pas reconnu
        navigate('/platform');
    }
  };
  
  

  return (
    <div className={`home-wrapper ${isLoaded ? 'loaded' : ''}`}>
      <header className={`site-header ${scrollPosition > 50 ? 'scrolled' : ''}`}>
        <div className="logo-container">
          <div className="logo">
            <span className="logo-icon">+</span>
            <span className="logo-text">HelloDoctor</span>
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
            <Nav.Link href="#structures">Structures</Nav.Link>
            <Nav.Link href="#about">À propos</Nav.Link>
            <Nav.Link href="#contact">Contact</Nav.Link>
            <Button 
              variant="outline-light" 
              className="nav-button"
              onClick={() => navigate('/auth')}
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
            <span className="logo-text">HelloDoctor</span>
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
            <Nav.Link href="#structures" onClick={() => setShowMenu(false)}>Structures</Nav.Link>
            <Nav.Link href="#about" onClick={() => setShowMenu(false)}>À propos</Nav.Link>
            <Nav.Link href="#contact" onClick={() => setShowMenu(false)}>Contact</Nav.Link>
            <Button 
              variant="primary" 
              className="w-100 mt-3"
              onClick={() => {
                setShowMenu(false);
                navigate('/auth');
              }}
            >
              Connexion / Inscription
            </Button>
          </div>
          
          <div className="mobile-quick-contact">
            <h5>Contact rapide</h5>
            <div className="contact-item">
              <FaPhone className="contact-icon" />
              <span>+221 33 825 7590</span>
            </div>
            <div className="contact-item emergency">
              <FaAmbulance className="contact-icon" />
              <div>
                <span className="emergency-label">URGENCES</span>
                <span className="emergency-number">+221 33 800 0000</span>
              </div>
            </div>
            <div className="contact-item">
              <FaWhatsapp className="contact-icon" />
              <span>+221 77 123 4567</span>
            </div>
            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <span>contact@HelloDoctor.com</span>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      <Container fluid className="min-vh-100 home-container p-0">
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
                  <span className="welcome-line">Bienvenue sur</span>
                  <span className="platform-name">HelloDoctor</span>
                </h1>
                <p className="lead hero-subtitle">
                  Votre plateforme de santé connectée au Sénégal
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
                  onClick={() => navigate('/auth')}
                >
                  Commencer maintenant <FaArrowRight className="ms-2" />
                </Button>
              </motion.div>
            </Col>
          </Row>
        </div>

        <div className="content-sections">
          <section id="structures" className="structures-section">
            <Container>
              <div className="section-header">
                <h2>Nos structures médicales partenaires</h2>
                <p>Choisissez parmi nos établissements de santé de confiance</p>
              </div>
              
              <div className="search-container">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Rechercher une structure, une spécialité ou une localité..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button 
                      className="clear-search" 
                      onClick={() => setSearchTerm('')}
                      aria-label="Effacer la recherche"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
              
              <Row xs={1} sm={2} lg={3} className="g-4 mt-4">
                {filteredStructures.length > 0 ? (
                  filteredStructures.map((structure, index) => (
                    <Col key={structure.id}>
                      <motion.div 
                        className="structure-card"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <div className="structure-image">
                          <img src={structure.image} alt={structure.name} />
                          <div className="structure-specialty">{structure.specialty}</div>
                        </div>
                        <div className="structure-content">
                          <h3>{structure.name}</h3>
                          <div className="structure-location">
                            <FaMapMarkerAlt /> {structure.location}
                          </div>
                          <div className="structure-rating">
                            <div className="stars">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < Math.floor(structure.rating) ? "star filled" : "star"}>★</span>
                              ))}
                            </div>
                            <span className="rating-value">{structure.rating}</span>
                            <span className="reviews-count">({structure.reviews} avis)</span>
                          </div>
                          <p className="structure-description">{structure.description}</p>
                          <Button 
                            variant="primary" 
                            className="structure-button"
                            onClick={() => handleStructureSelect(structure.id)}
                          >
                            Accéder <FaArrowRight className="ms-2" />
                          </Button>
                        </div>
                      </motion.div>
                    </Col>
                  ))
                ) : (
                  <Col xs={12}>
                    <div className="no-results">
                      <FaSearch size={40} className="no-results-icon" />
                      <h3>Aucune structure trouvée</h3>
                      <p>Essayez d'autres termes de recherche ou consultez toutes nos structures partenaires.</p>
                      <Button 
                        variant="outline-primary" 
                        onClick={() => setSearchTerm('')}
                      >
                        Voir toutes les structures
                      </Button>
                    </div>
                  </Col>
                )}
              </Row>
            </Container>
          </section>

          <section id="about" className="about-section">
            <Container>
              <div className="section-header">
                <h2>À propos d'HelloDoctor</h2>
                <p>Une plateforme innovante au service de la santé</p>
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
                      src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                      alt="HelloDoctor Platform" 
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
                      HelloDoctor est une plateforme innovante qui connecte les patients aux établissements 
                      de santé et aux professionnels médicaux à travers le Sénégal. Notre mission est de 
                      faciliter l'accès aux soins de santé pour tous en simplifiant la prise de rendez-vous 
                      et en améliorant la communication entre patients et prestataires de soins.
                    </p>
                    
                    <div className="accordion-section">
                      <div 
                        className={`accordion-item ${activeSection === 'vision' ? 'active' : ''}`}
                        onClick={() => toggleSection('vision')}
                      >
                        <div className="accordion-header">
                          <h4>Notre vision</h4>
                          <FaChevronDown className="accordion-icon" />
                        </div>
                        <AnimatePresence>
                          {activeSection === 'vision' && (
                            <motion.div 
                              className="accordion-content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <p>
                                Nous aspirons à devenir la référence en matière de solutions numériques de santé 
                                en Afrique, en contribuant à l'amélioration de l'accès aux soins et à la qualité 
                                des services médicaux. Notre vision est celle d'un système de santé connecté, 
                                efficace et accessible à tous.
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
                                <li>Accessibilité - Rendre les soins de santé accessibles à tous</li>
                                <li>Innovation - Utiliser la technologie pour améliorer l'expérience de santé</li>
                                <li>Qualité - Promouvoir l'excellence dans les services médicaux</li>
                                <li>Confidentialité - Protéger les données sensibles des patients</li>
                                <li>Inclusion - Servir toutes les communautés sans discrimination</li>
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div 
                        className={`accordion-item ${activeSection === 'advantages' ? 'active' : ''}`}
                        onClick={() => toggleSection('advantages')}
                      >
                        <div className="accordion-header">
                          <h4>Nos avantages</h4>
                          <FaChevronDown className="accordion-icon" />
                        </div>
                        <AnimatePresence>
                          {activeSection === 'advantages' && (
                            <motion.div 
                              className="accordion-content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ul>
                                <li>Prise de rendez-vous en ligne simple et rapide</li>
                                <li>Accès à un réseau diversifié d'établissements de santé</li>
                                <li>Dossier médical électronique sécurisé</li>
                                <li>Rappels automatiques pour les rendez-vous</li>
                                <li>Téléconsultation avec des professionnels de santé</li>
                              </ul>
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
                      <span>+221 33 825 7590</span>
                    </div>
                    <div className="contact-item">
                      <FaWhatsapp className="contact-icon" />
                      <span>+221 77 123 4567</span>
                    </div>
                    <div className="contact-item">
                      <FaEnvelope className="contact-icon" />
                      <span>contact@HelloDoctor.com</span>
                    </div>
                    <div className="contact-item">
                      <FaMapMarkerAlt className="contact-icon" />
                      <span>HelloDoctor, Dakar Plateau, Sénégal</span>
                    </div>
                    
                    <div className="opening-hours mt-4">
                      <h4>Horaires du support</h4>
                      <div className="hours-item">
                        <span className="day">Lundi - Vendredi:</span>
                        <span className="time">8h00 - 18h00</span>
                      </div>
                      <div className="hours-item">
                        <span className="day">Samedi:</span>
                        <span className="time">9h00 - 13h00</span>
                      </div>
                      <div className="hours-item">
                        <span className="day">Dimanche:</span>
                        <span className="time">Fermé</span>
                      </div>
                      <div className="hours-item emergency">
                        <span className="day">Support technique:</span>
                        <span className="time">24h/24, 7j/7</span>
                      </div>
                    </div>
                  </motion.div>
                </Col>
                
                <Col md={6}>
                <motion.div 
                    className="contact-form-container"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="contact-form">
                      <h4>Envoyez-nous un message</h4>
                      <form>
                        <div className="form-group mb-3">
                          <label htmlFor="name" className="form-label">Nom complet</label>
                          <input type="text" className="form-control" id="name" placeholder="Votre nom" />
                        </div>
                        <div className="form-group mb-3">
                          <label htmlFor="email" className="form-label">Email</label>
                          <input type="email" className="form-control" id="email" placeholder="votre@email.com" />
                        </div>
                        <div className="form-group mb-3">
                          <label htmlFor="subject" className="form-label">Sujet</label>
                          <input type="text" className="form-control" id="subject" placeholder="Sujet de votre message" />
                        </div>
                        <div className="form-group mb-3">
                          <label htmlFor="message" className="form-label">Message</label>
                          <textarea className="form-control" id="message" rows="4" placeholder="Votre message"></textarea>
                        </div>
                        <Button 
                          variant="primary" 
                          type="submit" 
                          className="w-100"
                        >
                          Envoyer le message
                        </Button>
                      </form>
                    </div>
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
                  <h2>Rejoignez notre plateforme de santé</h2>
                  <p>
                    Accédez facilement aux services médicaux, prenez rendez-vous en ligne et 
                    bénéficiez d'un suivi personnalisé avec HelloDoctor
                  </p>
                  <div className="cta-buttons">
                    
                    <Button 
                      size="lg" 
                      variant="outline-light"
                      className="cta-button-secondary"
                      onClick={() => navigate('/structure-registration')}
                    >
                      Devenir partenaire
                    </Button>
                  </div>
                </motion.div>
              </Col>
            </Row>
          </Container>
        </div>

        <section className="partners-section">
          <Container>
            <div className="section-header">
              <h2>Ils nous font confiance</h2>
              <p>Nos partenaires institutionnels et sponsors</p>
            </div>
            
            <div className="partners-logos">
              <motion.div 
                className="partner-logo"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="logo-placeholder">Ministère de la Santé</div>
              </motion.div>
              <motion.div 
                className="partner-logo"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="logo-placeholder">OMS</div>
              </motion.div>
              <motion.div 
                className="partner-logo"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="logo-placeholder">UNICEF</div>
              </motion.div>
              <motion.div 
                className="partner-logo"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="logo-placeholder">Orange</div>
              </motion.div>
              <motion.div 
                className="partner-logo"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="logo-placeholder">Sonatel</div>
              </motion.div>
            </div>
          </Container>
        </section>

        <footer className="site-footer">
          <Container>
            <Row className="gy-4">
              <Col md={4}>
                <div className="footer-logo">
                  <span className="logo-icon">+</span>
                  <span className="logo-text">HelloDoctor</span>
                </div>
                <p className="footer-tagline">
                  Votre plateforme de santé connectée au Sénégal
                </p>
                <div className="social-links">
                  <a href="#" className="social-link"><i className="bi bi-facebook"></i></a>
                  <a href="#" className="social-link"><i className="bi bi-twitter"></i></a>
                  <a href="#" className="social-link"><i className="bi bi-instagram"></i></a>
                  <a href="#" className="social-link"><i className="bi bi-linkedin"></i></a>
                </div>
              </Col>
              
              <Col md={2}>
                <h5>Liens rapides</h5>
                <ul className="footer-links">
                  <li><a href="#structures">Structures</a></li>
                  <li><a href="#about">À propos</a></li>
                  <li><a href="#contact">Contact</a></li>
                  <li><a href="#" onClick={() => navigate('/auth')}>Connexion</a></li>
                </ul>
              </Col>
              
              <Col md={3}>
                <h5>Services</h5>
                <ul className="footer-links">
                  <li><a href="#">Rendez-vous en ligne</a></li>
                  <li><a href="#">Téléconsultation</a></li>
                  <li><a href="#">Dossier médical</a></li>
                  <li><a href="#">Annuaire médical</a></li>
                  <li><a href="#">Conseils santé</a></li>
                </ul>
              </Col>
              
              <Col md={3}>
                <h5>Contact</h5>
                <div className="footer-contact">
                  <p><FaMapMarkerAlt className="me-2" /> Dakar Plateau, Sénégal</p>
                  <p><FaPhone className="me-2" /> +221 33 825 7590</p>
                  <p><FaEnvelope className="me-2" /> contact@HelloDoctor.com</p>
                </div>
              </Col>
            </Row>
            
            <hr className="footer-divider" />
            
            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} HelloDoctor. Tous droits réservés.développée par </p>
              <div className="footer-bottom-links">
                <a href="#">Conditions d'utilisation</a>
              </div>
            </div>
          </Container>
        </footer>

        <div className="mobile-fab">
          <Button 
            className="fab-button help-button"
            onClick={() => window.open('https://wa.me/221771234567', '_blank')}
            aria-label="Aide"
          >
            <FaWhatsapp />
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
        
        .home-wrapper {
          opacity: 0;
          transition: opacity 1s ease-out;
        }
        
        .home-wrapper.loaded {
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
        
        .platform-name {
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
        
        /* Structures Section */
        .structures-section {
          padding: 5rem 0;
        }
        
        .search-container {
          max-width: 800px;
          margin: 0 auto 2rem;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          background-color: white;
          border-radius: var(--border-radius-xl);
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
          padding: 0.5rem 1rem;
          position: relative;
        }
        
        .search-icon {
          color: var(--primary-color);
          font-size: 1.2rem;
          margin-right: 1rem;
        }
        
        .search-input {
          flex-grow: 1;
          border: none;
          font-size: 1rem;
          padding: 0.8rem 0;
          outline: none;
        }
        
        .clear-search {
          background: transparent;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.5rem;
        }
        
        .clear-search:hover {
          color: var(--accent-color);
        }
        
        .structure-card {
          background-color: white;
          border-radius: var(--border-radius-md);
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          height: 100%;
          transition: all var(--transition-medium);
          border: 1px solid #eee;
        }
        
        .structure-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
          border-color: var(--primary-color);
        }
        
        .structure-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        
        .structure-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-medium);
        }
        
        .structure-card:hover .structure-image img {
          transform: scale(1.05);
        }
        
        .structure-specialty {
          position: absolute;
          bottom: 0;
          left: 0;
          background-color: var(--primary-color);
          color: white;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-top-right-radius: var(--border-radius-sm);
        }
        
        .structure-content {
          padding: 1.5rem;
        }
        
        .structure-content h3 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--dark-color);
        }
        
        .structure-location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .structure-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .stars {
          display: flex;
        }
        
        .star {
          color: #ddd;
          font-size: 1rem;
        }
        
        .star.filled {
          color: #ffb400;
        }
        
        .rating-value {
          font-weight: 600;
          color: #333;
        }
        
        .reviews-count {
          color: #666;
          font-size: 0.9rem;
        }
        
        .structure-description {
          color: #666;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
          line-height: 1.5;
        }
        
        .structure-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.8rem;
          border-radius: var(--border-radius-md);
          background-color: var(--primary-color);
          border: none;
          transition: all var(--transition-medium);
        }
        
        .structure-button:hover {
          background-color: #3b78e7;
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(66, 133, 244, 0.3);
        }
        
        .no-results {
          text-align: center;
          padding: 3rem 0;
        }
        
        .no-results-icon {
          color: #ddd;
          margin-bottom: 1rem;
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
        
        .contact-form-container {
          height: 100%;
        }
        
        .contact-form {
          background-color: white;
          border-radius: var(--border-radius-md);
          padding: 2rem;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
          height: 100%;
        }
        
        .contact-form h4 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--dark-color);
          text-align: center;
        }
        
        .form-control {
          border-radius: var(--border-radius-sm);
          padding: 0.8rem;
          border: 1px solid #ddd;
        }
        
        .form-control:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.2rem rgba(66, 133, 244, 0.25);
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
        
        .cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
        }
        
        .cta-button {
          background-color: white;
          color: var(--primary-color);
          border: none;
          padding: 1rem 2rem;
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
        
        .cta-button-secondary {
          border: 2px solid white;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: var(--border-radius-xl);
          transition: all var(--transition-medium);
        }
        
        .cta-button-secondary:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
        }
        
        /* Partners Section */
        .partners-section {
          padding: 4rem 0;
          background-color: var(--light-color);
        }
        
        .partners-logos {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .partner-logo {
          flex: 0 0 150px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8f9fa;
          border-radius: var(--border-radius-sm);
          color: #666;
          font-weight: 600;
          transition: all var(--transition-medium);
        }
        
        .logo-placeholder:hover {
          background-color: #e9ecef;
          transform: scale(1.05);
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
          margin-bottom: 1rem;
        }
        
        .social-links {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .social-link {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        
        .social-link:hover {
          background-color: var(--primary-color);
          transform: translateY(-3px);
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
        
        .footer-contact p {
          display: flex;
          align-items: center;
          margin-bottom: 0.8rem;
          opacity: 0.7;
        }
        
        .footer-divider {
          border-color: rgba(255, 255, 255, 0.1);
          margin: 2rem 0;
        }
        
        .footer-bottom {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          opacity: 0.7;
          font-size: 0.9rem;
        }
        
        .footer-bottom-links {
          display: flex;
          gap: 1.5rem;
        }
        
        .footer-bottom-links a {
          color: white;
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        
        .footer-bottom-links a:hover {
          color: var(--primary-color);
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
        
        .help-button {
          background-color: #25D366;
          color: white;
          border: none;
        }
        
        .help-button:hover {
          transform: scale(1.1);
          background-color: #20bd5a;
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
          
          .cta-buttons {
            flex-direction: column;
            width: 100%;
          }
          
          .cta-button, .cta-button-secondary {
            width: 100%;
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
          
          .structures-section, .about-section, .contact-section, .partners-section {
            padding: 3rem 0;
          }
          
          .footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
          
          .footer-bottom-links {
            justify-content: center;
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
          
          .structure-image {
            height: 160px;
          }
          
          .structure-content h3 {
            font-size: 1.1rem;
          }
          
          .cta-content h2 {
            font-size: 1.5rem;
          }
          
          .cta-content p {
            font-size: 1rem;
          }
          
          .cta-button, .cta-button-secondary {
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
          
          .partners-logos {
            gap: 1rem;
          }
          
          .partner-logo {
            flex: 0 0 120px;
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default PlatformHome;
