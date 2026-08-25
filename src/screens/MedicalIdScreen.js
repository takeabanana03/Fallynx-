import React from 'react';
import PhaseStub from '../components/PhaseStub';

export default function MedicalIdScreen() {
  return (
    <PhaseStub
      title="Medical ID"
      phase={5}
      description="Blood group, allergies, medications and conditions. Stored on the phone so it reads with no signal."
    />
  );
}
