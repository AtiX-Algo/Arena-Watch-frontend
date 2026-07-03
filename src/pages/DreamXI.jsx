import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, Save, X, Search, ChevronDown, Zap, ShieldCheck, Crosshair } from 'lucide-react';
import useAuthStore from '../store/authStore';
import axios from 'axios';

// 29 Tactical Configurations accurately mapped to the board coordinates (x, y percentages)
const FORMATIONS = {
  '3-4-3': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 25, y: 75 }, { id: 2, role: 'CB', x: 50, y: 75 }, { id: 3, role: 'RCB', x: 75, y: 75 },
    { id: 4, role: 'LM', x: 15, y: 50 }, { id: 5, role: 'LCM', x: 38, y: 50 }, { id: 6, role: 'RCM', x: 62, y: 50 }, { id: 7, role: 'RM', x: 85, y: 50 },
    { id: 8, role: 'LW', x: 22, y: 16 }, { id: 9, role: 'ST', x: 50, y: 10 }, { id: 10, role: 'RW', x: 78, y: 16 }
  ],
  '3-4-2-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 25, y: 75 }, { id: 2, role: 'CB', x: 50, y: 75 }, { id: 3, role: 'RCB', x: 75, y: 75 },
    { id: 4, role: 'LM', x: 15, y: 52 }, { id: 5, role: 'LCM', x: 38, y: 54 }, { id: 6, role: 'RCM', x: 62, y: 54 }, { id: 7, role: 'RM', x: 85, y: 52 },
    { id: 8, role: 'LAM', x: 32, y: 28 }, { id: 9, role: 'RAM', x: 68, y: 28 }, { id: 10, role: 'ST', x: 50, y: 10 }
  ],
  '3-4-1-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 25, y: 75 }, { id: 2, role: 'CB', x: 50, y: 75 }, { id: 3, role: 'RCB', x: 75, y: 75 },
    { id: 4, role: 'LM', x: 15, y: 54 }, { id: 5, role: 'LCM', x: 38, y: 56 }, { id: 6, role: 'RCM', x: 62, y: 56 }, { id: 7, role: 'RM', x: 85, y: 54 },
    { id: 8, role: 'AM', x: 50, y: 34 }, { id: 9, role: 'LST', x: 35, y: 14 }, { id: 10, role: 'RST', x: 65, y: 14 }
  ],
  '3-5-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 25, y: 75 }, { id: 2, role: 'CB', x: 50, y: 75 }, { id: 3, role: 'RCB', x: 75, y: 75 },
    { id: 4, role: 'LWB', x: 15, y: 58 }, { id: 5, role: 'DM', x: 50, y: 54 }, { id: 6, role: 'RWB', x: 85, y: 58 },
    { id: 7, role: 'LCM', x: 32, y: 40 }, { id: 8, role: 'RCM', x: 68, y: 40 },
    { id: 9, role: 'LST', x: 35, y: 14 }, { id: 10, role: 'RST', x: 65, y: 14 }
  ],
  '3-1-4-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 25, y: 75 }, { id: 2, role: 'CB', x: 50, y: 75 }, { id: 3, role: 'RCB', x: 75, y: 75 },
    { id: 4, role: 'DM', x: 50, y: 60 },
    { id: 5, role: 'LM', x: 15, y: 42 }, { id: 6, role: 'LCM', x: 35, y: 42 }, { id: 7, role: 'RCM', x: 65, y: 42 }, { id: 8, role: 'RM', x: 85, y: 42 },
    { id: 9, role: 'LST', x: 35, y: 14 }, { id: 10, role: 'RST', x: 65, y: 14 }
  ],
  '3-2-4-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 25, y: 75 }, { id: 2, role: 'CB', x: 50, y: 75 }, { id: 3, role: 'RCB', x: 75, y: 75 },
    { id: 4, role: 'LDM', x: 35, y: 60 }, { id: 5, role: 'RDM', x: 65, y: 60 },
    { id: 6, role: 'LM', x: 15, y: 35 }, { id: 7, role: 'LCM', x: 35, y: 35 }, { id: 8, role: 'RCM', x: 65, y: 35 }, { id: 9, role: 'RM', x: 85, y: 35 },
    { id: 10, role: 'ST', x: 50, y: 12 }
  ],
  '3-6-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 25, y: 75 }, { id: 2, role: 'CB', x: 50, y: 75 }, { id: 3, role: 'RCB', x: 75, y: 75 },
    { id: 4, role: 'LDM', x: 35, y: 60 }, { id: 5, role: 'RDM', x: 65, y: 60 },
    { id: 6, role: 'LM', x: 15, y: 40 }, { id: 7, role: 'LCM', x: 35, y: 38 }, { id: 8, role: 'RCM', x: 65, y: 38 }, { id: 9, role: 'RM', x: 85, y: 40 },
    { id: 10, role: 'ST', x: 50, y: 12 }
  ],
  '4-4-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LM', x: 15, y: 48 }, { id: 6, role: 'LCM', x: 35, y: 52 }, { id: 7, role: 'RCM', x: 65, y: 52 }, { id: 8, role: 'RM', x: 85, y: 48 },
    { id: 9, role: 'LST', x: 35, y: 15 }, { id: 10, role: 'RST', x: 65, y: 15 }
  ],
  '4-4-1-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LM', x: 15, y: 52 }, { id: 6, role: 'LCM', x: 35, y: 55 }, { id: 7, role: 'RCM', x: 65, y: 55 }, { id: 8, role: 'RM', x: 85, y: 52 },
    { id: 9, role: 'CF', x: 50, y: 28 }, { id: 10, role: 'ST', x: 50, y: 11 }
  ],
  '4-3-3': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LCM', x: 30, y: 48 }, { id: 6, role: 'CM', x: 50, y: 55 }, { id: 7, role: 'RCM', x: 70, y: 48 },
    { id: 8, role: 'LW', x: 20, y: 16 }, { id: 9, role: 'ST', x: 50, y: 10 }, { id: 10, role: 'RW', x: 80, y: 16 }
  ],
  '4-2-3-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LDM', x: 35, y: 58 }, { id: 6, role: 'RDM', x: 65, y: 58 },
    { id: 7, role: 'LAM', x: 20, y: 32 }, { id: 8, role: 'AM', x: 50, y: 30 }, { id: 9, role: 'RAM', x: 80, y: 32 },
    { id: 10, role: 'ST', x: 50, y: 11 }
  ],
  '4-1-4-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'DM', x: 50, y: 62 },
    { id: 6, role: 'LM', x: 15, y: 42 }, { id: 7, role: 'LCM', x: 35, y: 42 }, { id: 8, role: 'RCM', x: 65, y: 42 }, { id: 9, role: 'RM', x: 85, y: 42 },
    { id: 10, role: 'ST', x: 50, y: 12 }
  ],
  '4-5-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LM', x: 15, y: 48 }, { id: 6, role: 'LCM', x: 32, y: 52 }, { id: 7, role: 'CM', x: 50, y: 56 }, { id: 8, role: 'RCM', x: 68, y: 52 }, { id: 9, role: 'RM', x: 85, y: 48 },
    { id: 10, role: 'ST', x: 50, y: 12 }
  ],
  '4-3-2-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LCM', x: 28, y: 55 }, { id: 6, role: 'CM', x: 50, y: 58 }, { id: 7, role: 'RCM', x: 72, y: 55 },
    { id: 8, role: 'LAM', x: 35, y: 32 }, { id: 9, role: 'RAM', x: 65, y: 32 },
    { id: 10, role: 'ST', x: 50, y: 12 }
  ],
  '4-2-2-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LDM', x: 35, y: 60 }, { id: 6, role: 'RDM', x: 65, y: 60 },
    { id: 7, role: 'LAM', x: 32, y: 36 }, { id: 8, role: 'RAM', x: 68, y: 36 },
    { id: 9, role: 'LST', x: 35, y: 15 }, { id: 10, role: 'RST', x: 65, y: 15 }
  ],
  '4-1-2-1-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'DM', x: 50, y: 62 },
    { id: 6, role: 'LCM', x: 30, y: 48 }, { id: 7, role: 'RCM', x: 70, y: 48 },
    { id: 8, role: 'AM', x: 50, y: 32 },
    { id: 9, role: 'LST', x: 35, y: 15 }, { id: 10, role: 'RST', x: 65, y: 15 }
  ],
  '4-3-1-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LCM', x: 28, y: 54 }, { id: 6, role: 'CM', x: 50, y: 56 }, { id: 7, role: 'RCM', x: 72, y: 54 },
    { id: 8, role: 'AM', x: 50, y: 34 },
    { id: 9, role: 'LST', x: 35, y: 15 }, { id: 10, role: 'RST', x: 65, y: 15 }
  ],
  '4-2-4': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LCM', x: 38, y: 52 }, { id: 6, role: 'RCM', x: 62, y: 52 },
    { id: 7, role: 'LW', x: 15, y: 16 }, { id: 8, role: 'LST', x: 38, y: 14 }, { id: 9, role: 'RST', x: 62, y: 14 }, { id: 10, role: 'RW', x: 85, y: 16 }
  ],
  '5-3-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LWB', x: 12, y: 65 }, { id: 2, role: 'LCB', x: 30, y: 75 }, { id: 3, role: 'CB', x: 50, y: 77 }, { id: 4, role: 'RCB', x: 70, y: 75 }, { id: 5, role: 'RWB', x: 88, y: 65 },
    { id: 6, role: 'LCM', x: 30, y: 46 }, { id: 7, role: 'CM', x: 50, y: 52 }, { id: 8, role: 'RCM', x: 70, y: 46 },
    { id: 9, role: 'LST', x: 35, y: 16 }, { id: 10, role: 'RST', x: 65, y: 16 }
  ],
  '5-4-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LWB', x: 12, y: 65 }, { id: 2, role: 'LCB', x: 30, y: 75 }, { id: 3, role: 'CB', x: 50, y: 77 }, { id: 4, role: 'RCB', x: 70, y: 75 }, { id: 5, role: 'RWB', x: 88, y: 65 },
    { id: 6, role: 'LM', x: 15, y: 44 }, { id: 7, role: 'LCM', x: 35, y: 48 }, { id: 8, role: 'RCM', x: 65, y: 48 }, { id: 9, role: 'RM', x: 85, y: 44 },
    { id: 10, role: 'ST', x: 50, y: 12 }
  ],
  '5-2-3': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LWB', x: 12, y: 65 }, { id: 2, role: 'LCB', x: 30, y: 75 }, { id: 3, role: 'CB', x: 50, y: 77 }, { id: 4, role: 'RCB', x: 70, y: 75 }, { id: 5, role: 'RWB', x: 88, y: 65 },
    { id: 6, role: 'LCM', x: 38, y: 48 }, { id: 7, role: 'RCM', x: 62, y: 48 },
    { id: 8, role: 'LW', x: 20, y: 16 }, { id: 9, role: 'ST', x: 50, y: 10 }, { id: 10, role: 'RW', x: 80, y: 16 }
  ],
  '5-2-2-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LWB', x: 12, y: 65 }, { id: 2, role: 'LCB', x: 30, y: 75 }, { id: 3, role: 'CB', x: 50, y: 77 }, { id: 4, role: 'RCB', x: 70, y: 75 }, { id: 5, role: 'RWB', x: 88, y: 65 },
    { id: 6, role: 'LCM', x: 38, y: 52 }, { id: 7, role: 'RCM', x: 62, y: 52 },
    { id: 8, role: 'LAM', x: 32, y: 30 }, { id: 9, role: 'RAM', x: 68, y: 30 }, { id: 10, role: 'ST', x: 50, y: 12 }
  ],
  '5-1-2-2': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LWB', x: 12, y: 65 }, { id: 2, role: 'LCB', x: 30, y: 75 }, { id: 3, role: 'CB', x: 50, y: 77 }, { id: 4, role: 'RCB', x: 70, y: 75 }, { id: 5, role: 'RWB', x: 88, y: 65 },
    { id: 7, role: 'DM', x: 50, y: 54 },
    { id: 6, role: 'LCM', x: 32, y: 38 }, { id: 8, role: 'RCM', x: 68, y: 38 },
    { id: 9, role: 'LST', x: 35, y: 15 }, { id: 10, role: 'RST', x: 65, y: 15 }
  ],
  '2-3-5': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 38, y: 75 }, { id: 2, role: 'RCB', x: 62, y: 75 },
    { id: 3, role: 'LCM', x: 25, y: 52 }, { id: 4, role: 'CM', x: 50, y: 55 }, { id: 5, role: 'RCM', x: 75, y: 52 },
    { id: 6, role: 'LW', x: 12, y: 16 }, { id: 7, role: 'LST', x: 32, y: 12 }, { id: 8, role: 'ST', x: 50, y: 10 }, { id: 9, role: 'RST', x: 68, y: 12 }, { id: 10, role: 'RW', x: 88, y: 16 }
  ],
  '2-3-2-3': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 38, y: 75 }, { id: 2, role: 'RCB', x: 62, y: 75 },
    { id: 3, role: 'LH', x: 25, y: 58 }, { id: 4, role: 'CH', x: 50, y: 60 }, { id: 5, role: 'RH', x: 75, y: 58 },
    { id: 6, role: 'LI', x: 32, y: 38 }, { id: 7, role: 'RI', x: 68, y: 38 },
    { id: 8, role: 'LW', x: 15, y: 16 }, { id: 9, role: 'ST', x: 50, y: 10 }, { id: 10, role: 'RW', x: 85, y: 16 }
  ],
  '3-3-3-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LCB', x: 25, y: 75 }, { id: 2, role: 'CB', x: 50, y: 75 }, { id: 3, role: 'RCB', x: 75, y: 75 },
    { id: 4, role: 'LDM', x: 28, y: 58 }, { id: 5, role: 'DM', x: 50, y: 60 }, { id: 6, role: 'RDM', x: 72, y: 58 },
    { id: 7, role: 'LAM', x: 25, y: 34 }, { id: 8, role: 'AM', x: 50, y: 32 }, { id: 9, role: 'RAM', x: 75, y: 34 },
    { id: 10, role: 'ST', x: 50, y: 12 }
  ],
  '4-6-0': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LB', x: 15, y: 72 }, { id: 2, role: 'LCB', x: 35, y: 75 }, { id: 3, role: 'RCB', x: 65, y: 75 }, { id: 4, role: 'RB', x: 85, y: 72 },
    { id: 5, role: 'LDM', x: 35, y: 55 }, { id: 6, role: 'RDM', x: 65, y: 55 },
    { id: 7, role: 'LM', x: 15, y: 32 }, { id: 8, role: 'LCM', x: 35, y: 30 }, { id: 9, role: 'RCM', x: 65, y: 30 }, { id: 10, role: 'RM', x: 85, y: 32 }
  ],
  '6-3-1': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'LWB', x: 10, y: 70 }, { id: 2, role: 'LB', x: 26, y: 75 }, { id: 3, role: 'LCB', x: 42, y: 77 }, { id: 4, role: 'RCB', x: 58, y: 77 }, { id: 5, role: 'RB', x: 74, y: 75 }, { id: 6, role: 'RWB', x: 90, y: 70 },
    { id: 7, role: 'LCM', x: 30, y: 48 }, { id: 8, role: 'CM', x: 50, y: 52 }, { id: 9, role: 'RCM', x: 70, y: 48 },
    { id: 10, role: 'ST', x: 50, y: 14 }
  ],
  '1-3-3-3': [
    { id: 0, role: 'GK', x: 50, y: 90 },
    { id: 1, role: 'SW', x: 50, y: 80 },
    { id: 2, role: 'LCB', x: 25, y: 72 }, { id: 3, role: 'CB', x: 50, y: 72 }, { id: 4, role: 'RCB', x: 75, y: 72 },
    { id: 5, role: 'LCM', x: 30, y: 48 }, { id: 6, role: 'CM', x: 50, y: 52 }, { id: 7, role: 'RCM', x: 70, y: 48 },
    { id: 8, role: 'LW', x: 20, y: 16 }, { id: 9, role: 'ST', x: 50, y: 10 }, { id: 10, role: 'RW', x: 80, y: 16 }
  ]
};

const COUNTRIES = [
  "All", "Afghanistan", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antigua and Barbuda", 
  "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", 
  "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", 
  "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", 
  "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Chinese Taipei", "Colombia", "Comoros", "Congo", 
  "Cook Islands", "Costa Rica", "Croatia", "Cuba", "Curacao", "Cyprus", "Czech Republic", "DR Congo", "Denmark", "Djibouti", 
  "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "England", "Equatorial Guinea", "Eritrea", "Estonia", 
  "Eswatini", "Ethiopia", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "Gabon", "Gambia", "Georgia", 
  "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guinea", "Guinea-Bissau", 
  "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Israel", "Italy", 
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", 
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", 
  "Malaysia", "Maldives", "Mali", "Malta", "Martinique", "Mauritania", "Mauritius", "Mexico", "Moldova", "Mongolia", 
  "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal", "Netherlands", "New Caledonia", 
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Northern Ireland", "Northern Mariana Islands", 
  "Norway", "Oman", "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", 
  "Portugal", "Puerto Rico", "Qatar", "Republic of Ireland", "Reunion", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", 
  "Saint Lucia", "Saint Martin", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", 
  "Saudi Arabia", "Scotland", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", 
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", 
  "Sweden", "Switzerland", "Syria", "Tahiti", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", 
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Uganda", "Ukraine", 
  "United Arab Emirates", "United States", "Uruguay", "US Virgin Islands", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", 
  "Wales", "Yemen", "Zambia", "Zimbabwe"
];

export default function DreamXI() {
  const { user } = useAuthStore();
  const [formation, setFormation] = useState('4-3-3');
  const [squad, setSquad] = useState(Array(11).fill(null));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [communityStats, setCommunityStats] = useState([]);

  useEffect(() => {
    fetchCommunityStats();
  }, []);

  useEffect(() => {
    if (user?.firebaseUid) {
      fetchUserSavedTeam(user.firebaseUid);
    }
  }, [user]);

  useEffect(() => {
    if (isModalOpen) fetchPlayers();
  }, [isModalOpen, selectedCountry]);

  const fetchCommunityStats = async () => {
    try {
      const res = await axios.get('https://arena-watch-backend-1.onrender.com/api/dreamxi/stats');
      setCommunityStats(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserSavedTeam = async (userId) => {
    try {
      const res = await axios.get(`https://arena-watch-backend-1.onrender.com/api/dreamxi/user/${userId}`);
      if (res.data && res.data.players) {
        setFormation(res.data.formation || '4-3-3');
        setSquad(res.data.players);
      }
    } catch (err) {
      console.error("No previously saved setup found for session.", err);
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await axios.get(`https://arena-watch-backend-1.onrender.com/api/dreamxi/players/${selectedCountry}`);
      setAvailablePlayers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSlotClick = (index) => {
    setActiveSlot(index);
    setIsModalOpen(true);
  };

  const handleSelectPlayer = (player) => {
    const newSquad = [...squad];
    newSquad[activeSlot] = player;
    setSquad(newSquad);
    setIsModalOpen(false);
    setActiveSlot(null);
  };

  const handleSaveTeam = async () => {
    if (!user) return alert('Please sign in to save your Dream XI');
    if (squad.includes(null)) return alert('Please fill all 11 positions before saving!');

    try {
      await axios.post('https://arena-watch-backend-1.onrender.com/api/dreamxi/save', {
        userId: user.firebaseUid,
        userName: user.name,
        formation,
        players: squad
      });
      alert('Tactical setup saved to the mainframe.');
      fetchCommunityStats();
    } catch (err) {
      console.error(err);
      alert('Error saving team.');
    }
  };

  // Comprehensive, strict calculation matrix across all 29 dynamic layouts
  const tacticalStrength = useMemo(() => {
    const roles = FORMATIONS[formation] || [];
    let attackWeight = 0, midfieldWeight = 0, defenseWeight = 0;
    let attCount = 0, midCount = 0, defCount = 0;

    roles.forEach((slot, index) => {
      const player = squad[index];
      if (!player) return;

      const rating = player.rating || 0;

      if (['ST', 'LST', 'RST', 'LW', 'RW', 'CF', 'LI', 'RI'].includes(slot.role)) {
        attackWeight += rating;
        attCount++;
      } else if (['CM', 'LCM', 'RCM', 'LM', 'RM', 'AM', 'LAM', 'RAM', 'DM', 'LDM', 'RDM', 'LH', 'CH', 'RH'].includes(slot.role)) {
        midfieldWeight += rating;
        midCount++;
      } else if (['GK', 'LB', 'LCB', 'RCB', 'CB', 'RB', 'LWB', 'RWB', 'SW'].includes(slot.role)) {
        defenseWeight += rating;
        defCount++;
      }
    });

    return {
      attack: attCount > 0 ? Math.round(attackWeight / attCount) : 0,
      midfield: midCount > 0 ? Math.round(midfieldWeight / midCount) : 0,
      defense: defCount > 0 ? Math.round(defenseWeight / defCount) : 0,
    };
  }, [squad, formation]);

  const topFormation = communityStats.length > 0 ? communityStats[0]._id : 'N/A';
  const sameFormationCount = communityStats.find(s => s._id === formation)?.count || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-[#09090b]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="text-emerald-500 w-8 h-8" /> Tactical Draft
          </h1>
          <p className="text-sm text-gray-500 mt-2">Construct your ultimate squad profile.</p>
        </div>

        <div className="flex items-center gap-4">
          <select 
            className="bg-[#111] border border-gray-800 text-white text-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-emerald-500 max-w-xs"
            value={formation}
            onChange={(e) => {
              setFormation(e.target.value);
              setSquad(Array(11).fill(null)); 
            }}
          >
            {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f} Formation</option>)}
          </select>
          
          <button 
            onClick={handleSaveTeam}
            className="flex items-center gap-2 bg-emerald-500 text-black px-5 py-2 rounded-lg font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10"
          >
            <Save className="w-4 h-4" /> Save Formation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* The Pitch Board */}
        <div className="lg:col-span-2 relative bg-[#060608] rounded-2xl border border-gray-800/80 overflow-hidden aspect-[3/4] sm:aspect-square shadow-2xl">
          <div className="absolute inset-4 border-2 border-gray-800/30 rounded-lg pointer-events-none" />
          <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-gray-800/30 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-gray-800/30 rounded-full pointer-events-none" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-28 border-2 border-gray-800/30 rounded-b-lg pointer-events-none" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-28 border-2 border-gray-800/30 rounded-t-lg pointer-events-none" />

          {/* Players Coordinates Placement */}
          {(FORMATIONS[formation] || []).map((pos, idx) => {
            const player = squad[idx];
            return (
              <div 
                key={pos.id}
                onClick={() => handleSlotClick(idx)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                  player ? 'border-emerald-500 bg-black shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'border-gray-800 bg-[#111] group-hover:border-gray-600'
                }`}>
                  {player ? (
                    <img src={player.imageUrl} alt={player.name} className="w-full h-full rounded-full object-cover p-0.5" />
                  ) : (
                    <span className="text-xs font-black text-gray-500 group-hover:text-gray-300">{pos.role}</span>
                  )}
                </div>
                
                {player && (
                  <div className="mt-1.5 text-center bg-black/90 backdrop-blur-sm border border-gray-800 px-2 py-0.5 rounded-md shadow-xl min-w-[70px]">
                    <p className="text-[10px] font-bold text-white whitespace-nowrap truncate max-w-[85px]">{player.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className="text-[9px] font-black text-emerald-400">{player.rating} OVR</span>
                      {player.selectionRate && (
                        <span className="text-[8px] text-gray-500 font-medium">({player.selectionRate})</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Diagnostics */}
        <div className="space-y-6">
          
          {/* Section Dynamic Meters */}
          <div className="bg-[#0d0d0f] border border-gray-800/90 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-gray-800 pb-3">
              <Zap className="w-4 h-4 text-emerald-500" /> Squad Strength Analytics
            </h3>
            
            <div className="space-y-3.5">
              {/* Attack Meter */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-400 flex items-center gap-1.5"><Crosshair className="w-3.5 h-3.5 text-amber-500" /> Attack Power</span>
                  <span className="text-white font-black">{tacticalStrength.attack} <span className="text-[10px] text-gray-500">/99</span></span>
                </div>
                <div className="w-full bg-[#161619] h-2 rounded-full overflow-hidden border border-gray-800">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(tacticalStrength.attack / 99) * 100}%` }} />
                </div>
              </div>

              {/* Midfield Meter */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> Midfield Control</span>
                  <span className="text-white font-black">{tacticalStrength.midfield} <span className="text-[10px] text-gray-500">/99</span></span>
                </div>
                <div className="w-full bg-[#161619] h-2 rounded-full overflow-hidden border border-gray-800">
                  <div className="bg-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${(tacticalStrength.midfield / 99) * 100}%` }} />
                </div>
              </div>

              {/* Defense Meter */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Defensive Wall</span>
                  <span className="text-white font-black">{tacticalStrength.defense} <span className="text-[10px] text-gray-500">/99</span></span>
                </div>
                <div className="w-full bg-[#161619] h-2 rounded-full overflow-hidden border border-gray-800">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(tacticalStrength.defense / 99) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Global Meta */}
          <div className="bg-[#0d0d0f] border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-500" /> Global Setup Data
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#131316] p-3 rounded-lg border border-gray-800/60">
                <span className="text-xs text-gray-400 font-semibold">Most Popular Setup</span>
                <span className="font-black text-emerald-400 text-xs">{topFormation}</span>
              </div>
              
              <div className="flex justify-between items-center bg-[#131316] p-3 rounded-lg border border-gray-800/60">
                <span className="text-xs text-gray-400 font-semibold">Using Your Formation</span>
                <span className="font-black text-white text-xs">{sameFormationCount} Users</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Player Selection Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          >
            <div className="bg-[#09090b] border border-gray-800 p-6 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col relative shadow-2xl">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-md font-black text-white mb-5 uppercase tracking-widest text-center">
                Deploy {FORMATIONS[formation]?.[activeSlot]?.role} Asset
              </h2>

              {/* Filtering Controls */}
              <div className="flex gap-4 mb-5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search available player roster..." 
                    className="w-full bg-[#111] border border-gray-800 text-white rounded-lg pl-10 pr-4 py-2 text-xs focus:border-emerald-500 outline-none font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <select 
                    className="appearance-none bg-[#111] border border-gray-800 text-white rounded-lg pl-4 pr-10 py-2 text-xs focus:border-emerald-500 outline-none cursor-pointer font-bold max-w-[160px]"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Scrollable Player Output List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {availablePlayers
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(player => (
                    <div 
                      key={player.id}
                      onClick={() => handleSelectPlayer(player)}
                      className="flex items-center justify-between p-3 bg-[#121215] border border-gray-800/80 rounded-xl hover:border-emerald-500 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <img src={player.imageUrl} alt={player.name} className="w-10 h-10 rounded-full border border-gray-800 object-cover" />
                        <div>
                          <h4 className="font-bold text-white text-xs group-hover:text-emerald-400 transition-colors">{player.name}</h4>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {player.country} • {player.position}
                            {player.selectionRate && <span className="text-gray-600 ml-1">({player.selectionRate} pick rate)</span>}
                          </p>
                        </div>
                      </div>
                      <div className="bg-black border border-gray-800 px-3 py-1 rounded-md text-emerald-400 font-black text-xs">
                        {player.rating}
                      </div>
                    </div>
                ))}
                
                {availablePlayers.length === 0 && (
                  <p className="text-center text-gray-500 py-12 text-xs italic">No matching database records found for this filter combination.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}