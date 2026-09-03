import React from "react";
import type { ResumeTemplateProps } from "./types";
import AtsClassicTemplate from "./AtsClassicTemplate";
import ModernDeveloperTemplate from "./ModernDeveloperTemplate";
import MinimalTemplate from "./MinimalTemplate";
import TwoColumnTemplate from "./TwoColumnTemplate";
import CompactTemplate from "./CompactTemplate";

export const ResumeTemplateRenderer: React.FC<ResumeTemplateProps> = (props) => {
  const templateId = props.config?.templateId || "ats-classic";

  switch (templateId) {
    case "modern-developer":
      return <ModernDeveloperTemplate {...props} />;
    case "minimal":
      return <MinimalTemplate {...props} />;
    case "two-column":
      return <TwoColumnTemplate {...props} />;
    case "compact":
      return <CompactTemplate {...props} />;
    case "ats-classic":
    default:
      return <AtsClassicTemplate {...props} />;
  }
};

export default React.memo(ResumeTemplateRenderer);
