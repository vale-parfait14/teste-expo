import React, { useState } from 'react';

const CalendarComponent = () => {
    const [showCalendar, setShowCalendar] = useState(false);

    return (
        <div>
            <button onClick={() => setShowCalendar(!showCalendar)}>
                {showCalendar ? 'Cacher le calendrier' : 'Afficher le calendrier'}
            </button>
            {showCalendar && (
                <div>
                    {/* Code du calendrier */}
                </div>
            )}
        </div>
    );
};

export default CalendarComponent;
