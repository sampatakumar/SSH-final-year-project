import React, { TableHTMLAttributes } from "react";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  responsiveWrapper?: boolean;
}

export const Table: React.FC<TableProps> = ({ children, responsiveWrapper = true, className = "", ...props }) => {
  const table = (
    <table className={`ssh-table ${className}`} {...props}>
      {children}
    </table>
  );

  if (responsiveWrapper) {
    return <div className="ssh-table-responsive">{table}</div>;
  }

  return table;
};
