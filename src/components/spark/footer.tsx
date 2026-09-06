import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer-custom">
      <div className="footer-left">
        <span className="footer-logo">
          <i className="bi bi-asterisk" /> Dementa
        </span>
        <span className="footer-separator">|</span>
        <span className="footer-copy">One place for the class&rsquo;s academic journey</span>
      </div>
      <div className="footer-right">
        <ul className="footer-links">
          <li>
            <Link href="/home" className="footer-link">
              Home
            </Link>
          </li>
          <li>
            <Link href="/subjects" className="footer-link">
              Subjects
            </Link>
          </li>
          <li>
            <Link href="/wallet" className="footer-link">
              Wallet
            </Link>
          </li>
          <li>
            <span className="footer-link">
              All systems normal <span className="status-dot" />
            </span>
          </li>
        </ul>
      </div>
    </footer>
  );
}
