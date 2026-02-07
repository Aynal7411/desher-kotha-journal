import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta?.env?.MODE !== "production") {
      console.error("ErrorBoundary caught an error:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: "2rem 0" }}>
          <div className="alert">দুঃখিত, কিছু সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।</div>
        </div>
      );
    }
    return this.props.children;
  }
}
