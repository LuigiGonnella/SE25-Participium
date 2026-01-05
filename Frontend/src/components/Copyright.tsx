import '@fortawesome/fontawesome-free/css/all.min.css';

function CopyrightComponent() {
  return (
    <footer className="cc-footer mt-auto">
        <div className="container">
            <div className="d-flex justify-content-center align-items-center flex-wrap">
                <small className="text-muted">
                    © 2026 Participium. Licensed under a <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 International License</a>.
                </small>
            </div>
            <div className="d-flex justify-content-center align-items-center mb-1">
                <div className="cc-icon text-secondary"><i className="fab fa-creative-commons"></i></div>
                <div className="cc-icon text-secondary"><i className="fab fa-creative-commons-by"></i></div>
                <div className="cc-icon text-secondary"><i className="fab fa-creative-commons-nc"></i></div>
                <div className="cc-icon text-secondary"><i className="fab fa-creative-commons-sa"></i></div>
            </div>
        </div>           
    </footer>
  );
}

function CopyrightComponentMap() {
  return (
    <div 
      className="cc-banner bg-light p-2 shadow-sm"
      style={{
        position: 'fixed',
        bottom: '0px',
        left: '0px',
        right: '0px',
        zIndex: 1000,
        fontSize: '0.8rem',
        width: 'fit-content',
        opacity: 0.85,
      }}
    >
      <div className="d-flex align-items-center">
        <small style={{
          lineHeight: 0, 
          fontSize: '0.8rem',
          opacity: 1
        }}>
          © 2026 Participium. <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank"> CC BY-NC-SA 4.0</a>
        </small>
      </div>
    </div>
    );
}

export {CopyrightComponent, CopyrightComponentMap};