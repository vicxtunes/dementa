import Link from "next/link";

export default function NotFound() {
  return (
    <div className="login-wrapper">
      <div className="login-bg-shape login-bg-shape-1" />
      <div className="login-bg-shape login-bg-shape-2" />
      <div className="error-card-custom" style={{ maxWidth: 560, width: "100%" }}>
        <div className="error-title-huge">
          4<i className="bi bi-asterisk" />4
        </div>
        <h2 className="error-subtitle">This page wandered off</h2>
        <p className="error-desc">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved. Let&rsquo;s get you back
          to your revision.
        </p>
        <div className="error-actions-group">
          <Link href="/home" className="btn-custom btn-custom-primary btn-custom-lg">
            Back to home
          </Link>
          <Link href="/subjects" className="btn-custom btn-custom-light btn-custom-lg">
            Browse subjects
          </Link>
        </div>
      </div>
    </div>
  );
}
