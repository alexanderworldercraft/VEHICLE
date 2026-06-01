import React from 'react';
import TabsDashBoard from './TabsDashBoard';

const VehiculePage = () => {
  return (
    <main className="mx-auto max-w-7xl grow">
      <div className="text-neutral-100">
        <div className="grid grid-cols-1 gap-8">
          <TabsDashBoard />
        </div>
      </div>
    </main>
  );
};

export default VehiculePage;
