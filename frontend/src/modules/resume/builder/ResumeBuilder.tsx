import React from "react";
import { ResumeEditor, type ResumeEditorProps } from "./ResumeEditor";

export type ResumeBuilderProps = ResumeEditorProps;

export const ResumeBuilder: React.FC<ResumeBuilderProps> = (props) => {
  return <ResumeEditor {...props} />;
};

export default ResumeBuilder;
