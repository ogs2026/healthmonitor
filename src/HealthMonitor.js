// @section:imports @depends:[]
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, StatusBar, Platform, Alert, Image, Linking, useWindowDimensions } from 'react-native';
import { LIBRARY, LIBRARY_DISCLAIMER } from './library';
import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useStorage, seedSampleRows, useCamera, useBluetooth, clearAllData } from './platform-hooks';
import { LEVELS, levelFor, worstLevel, NEXT_STEPS, INDICATOR_CONTEXT, ENVIRONMENTS, environmentFor, BODY_SYSTEMS, ALERT_LIMITS_NOTE, daysSince } from './challenge';
// @end:imports

// @section:theme @depends:[]
var primaryColor = '#102A56';
var accentColor = '#3D8BFF';
var backgroundColor = '#071426';
var cardColor = '#10213A';
var textPrimary = '#EAF3FF';
var textSecondary = '#A9BEDA';
var surfaceAltColor = '#1B3455';
var borderColor = '#29466B';
var onAccentColor = '#FFFFFF';
var accentSoftColor = '#183B68';
// Light blue for icons, chips and active tabs; primaryColor is too dark to read on the midnight background.
var highlightColor = '#8CC5FF';
var radiusSm = 4;
var radiusMd = 8;
var radiusPill = 999;
var visualDesign = 'Deep-space mission health utility with layered midnight-blue surfaces, luminous blue highlights, subtle starfield details, compact rows, and clear system typography.';
var TAB_MENU_HEIGHT = Platform.OS === 'web' ? 56 : 49;
var SCROLL_EXTRA_PADDING = 16;
var DEFAULT_PROFILE = { name: '', missionStart: '', environment: 'station' };
var DEFAULT_RANGES = { systolic: '105–130', diastolic: '65–85', heart: '58–68', glucose: '70–110', temperature: '36.1–37.2', sleep: '7–9' };
// @end:theme

// @section:navigation-setup @depends:[]
var Tab = createBottomTabNavigator();
var Stack = createStackNavigator();
// @end:navigation-setup

// @section:ThemeContext @depends:[theme]
var ThemeContext = React.createContext(null);
var ThemeProvider = function(props) {
  var darkState = React.useState(false);
  return React.createElement(ThemeContext.Provider, {
    value: {
      theme: { colors: { primary: primaryColor, accent: accentColor, background: backgroundColor, card: cardColor, textPrimary: textPrimary, textSecondary: textSecondary } },
      darkMode: darkState[0],
      toggleDarkMode: function() { darkState[1](function(value) { return !value; }); },
      visualDesign: visualDesign
    }
  }, props.children);
};
var useTheme = function() { return React.useContext(ThemeContext); };
// @end:ThemeContext

// @section:sample-data @depends:[]
var SAMPLE_ROWS = {
  health_check_ins: [
    { recorded_at: '@day(-6 14:09)', systolic_pressure: 119, diastolic_pressure: 77, heart_rate: 63, blood_sugar: 90, body_temperature: 36.6, sleep_hours: 7.8, mood: 'good', notes: 'Seated and rested.' },
    { recorded_at: '@day(-5 14:15)', systolic_pressure: 122, diastolic_pressure: 79, heart_rate: 66, blood_sugar: 95, body_temperature: 36.7, sleep_hours: 7.2, mood: 'neutral', notes: 'Seated and rested.' },
    { recorded_at: '@day(-4 14:11)', systolic_pressure: 124, diastolic_pressure: 81, heart_rate: 65, blood_sugar: 94, body_temperature: 36.7, sleep_hours: 7.1, mood: 'good', notes: 'After exercise recovery.' },
    { recorded_at: '@day(-3 14:22)', systolic_pressure: 116, diastolic_pressure: 74, heart_rate: 61, blood_sugar: 91, body_temperature: 36.6, sleep_hours: 7.5, mood: 'neutral', notes: 'Seated and rested.' },
    { recorded_at: '@day(-2 14:06)', systolic_pressure: 121, diastolic_pressure: 78, heart_rate: 64, blood_sugar: 93, body_temperature: 36.8, sleep_hours: 7.3, mood: 'good', notes: 'Seated and rested.' },
    { recorded_at: '@day(-1 14:18)', systolic_pressure: 127, diastolic_pressure: 83, heart_rate: 70, blood_sugar: 96, body_temperature: 36.9, sleep_hours: 6.1, mood: 'low', notes: 'Late shift, short sleep. Simulated sample data.' }
  ]
};
var INDICATORS = [
  { key: 'pressure', title: 'Blood pressure', hint: 'Seated, after five minutes of rest', unit: 'mmHg', icon: 'heart-outline' },
  { key: 'heart', title: 'Resting heart rate', hint: 'Count after resting', unit: 'bpm', icon: 'pulse-outline' },
  { key: 'glucose', title: 'Blood glucose', hint: 'Before the next meal', unit: 'mg/dL', icon: 'water-outline' },
  { key: 'temperature', title: 'Body temperature', hint: 'Use the oral thermometer', unit: '°C', icon: 'sunny-outline' },
  { key: 'sleep', title: 'Sleep duration', hint: 'Last sleep period', unit: 'hours', icon: 'moon-outline' },
  { key: 'mood', title: 'Mood check-in', hint: 'Notice changes in focus or stress', unit: '', icon: 'happy-outline' }
];
var GUIDES = [
  { key: 'pressure', title: 'Blood pressure', hint: 'Rest five minutes before taking a seated reading', icon: 'heart-outline', steps: [['Rest for five minutes', 'Sit quietly; avoid exercise or caffeine beforehand.'], ['Fit the cuff on bare skin', 'Keep it snug on your upper arm, just above the elbow.'], ['Support your arm at heart level', 'Keep your feet supported and avoid talking during the reading.'], ['Repeat after one minute', 'Record both results and note any symptoms.']] },
  { key: 'glucose', title: 'Blood glucose', hint: 'Record timing in relation to meals', icon: 'water-outline', steps: [['Check the meter', 'Follow its instructions and use a fresh test strip.'], ['Clean and dry your hands', 'Follow the approved sampling procedure.'], ['Record the result', 'Note whether the reading was before or after a meal.']] },
  { key: 'sleep', title: 'Sleep duration', hint: 'Track your last sleep period and quality', icon: 'moon-outline', steps: [['Recall your last sleep period', 'Note when you fell asleep and woke up.'], ['Record duration', 'Include interruptions and how rested you feel.']] },
  { key: 'mood', title: 'Mood check-in', hint: 'Notice changes in focus, stress, or connection', icon: 'happy-outline', steps: [['Pause and reflect', 'Notice your mood, focus, and connection with the crew.'], ['Record honestly', 'Share sustained changes with crew medical support.']] },
  { key: 'temperature', title: 'Body temperature', hint: 'Use the same method when comparing readings', icon: 'sunny-outline', steps: [['Prepare the thermometer', 'Follow its cleaning and operating instructions.'], ['Take an oral reading', 'Wait after hot or cold drinks, then record the result.']] },
  { key: 'bones', title: 'Bone and muscle changes', hint: 'Support strength and loading in altered gravity', icon: 'barbell-outline', steps: [['Follow your exercise plan', 'Use prescribed resistive and aerobic exercise.'], ['Report changes', 'Tell the medical team about new pain or weakness.']] },
  { key: 'cardio', title: 'Cardiovascular changes', hint: 'Know your baseline and when to report a change', icon: 'pulse-outline', steps: [['Check your baseline', 'Measure at rest and note symptoms.'], ['Report concerning changes', 'Contact crew medical support for persistent changes.']] },
  { key: 'immune', title: 'Immune health during long-duration missions', hint: 'Track symptoms and contact the medical team', icon: 'shield-checkmark-outline', steps: [['Notice symptoms', 'Record fever, fatigue, or other changes.'], ['Contact support', 'Follow onboard medical protocols.']] }
];
// @end:sample-data

// @section:shared-helpers @depends:[sample-data]
var showMessage = function(title, message) {
  Platform.OS === 'web' ? window.alert(message) : Alert.alert(title, message);
};
var formatDate = function(value) {
  var date = new Date(value);
  return isNaN(date.getTime()) ? 'Recent reading' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
var flightDay = function(start) {
  if (!start) return 1;
  var date = new Date(start);
  return isNaN(date.getTime()) ? 1 : Math.max(1, Math.floor((Date.now() - date.getTime()) / 86400000) + 1);
};
var dateLine = function(profile) {
  var clock = new Date().toISOString().slice(11, 16);
  return 'Flight day ' + flightDay(profile.missionStart) + ' · ' + clock + ' UTC';
};
var reading = function(row, key) {
  if (!row) return '';
  if (key === 'pressure') return row.systolic_pressure != null && row.diastolic_pressure != null ? row.systolic_pressure + '/' + row.diastolic_pressure : '';
  if (key === 'heart') return row.heart_rate != null ? row.heart_rate + ' bpm' : '';
  if (key === 'glucose') return row.blood_sugar != null ? row.blood_sugar + ' mg/dL' : '';
  if (key === 'temperature') return row.body_temperature != null ? row.body_temperature + ' °C' : '';
  if (key === 'sleep') return row.sleep_hours != null ? Number(row.sleep_hours).toFixed(1) + ' hours' : '';
  if (key === 'mood') return row.mood ? ({ very_low: 'Very low', low: 'Low', neutral: 'Steady', good: 'Good', very_good: 'Very good' }[row.mood] || row.mood) : '';
  return '';
};
var outside = function(value, range) {
  var parts = String(range || '').split(/[–-]/).map(Number);
  return value != null && parts.length === 2 && isFinite(parts[0]) && isFinite(parts[1]) && (Number(value) < parts[0] || Number(value) > parts[1]);
};
var statusFor = function(row, key, ranges) {
  var level = levelFor(row, key, ranges);
  if (level === 'none') return 'Not recorded';
  if (level === 'urgent') return 'Urgent · contact medical support';
  if (key === 'mood') return level === 'watch' ? 'Check in with crew support' : 'Mood recorded';
  return level === 'watch' ? 'Outside your usual range' : 'Within your usual range';
};
var LevelDot = function(props) {
  return React.createElement(View, { style: [styles.statusDot, { backgroundColor: LEVELS[props.level || 'none'].color, width: props.size || 10, height: props.size || 10 }] });
};
var LevelBadge = function(props) {
  var level = LEVELS[props.level || 'none'];
  return React.createElement(View, { style: [styles.levelBadge, { borderColor: level.color }] },
    React.createElement(Ionicons, { name: level.icon, size: 14, color: level.color }),
    React.createElement(Text, { style: [styles.levelBadgeText, { color: level.color }] }, level.label)
  );
};
var latestFor = function(rows, key) {
  return rows.find(function(row) { return !!reading(row, key); }) || null;
};
var BackHeader = function(props) {
  return React.createElement(View, { style: styles.backHeader, componentId: props.id + '-header' },
    React.createElement(TouchableOpacity, { style: styles.backButton, activeOpacity: 0.7, onPress: props.onBack, componentId: props.id + '-back' },
      React.createElement(Ionicons, { name: 'chevron-back', size: 24, color: highlightColor })
    ),
    React.createElement(Text, { style: styles.backTitle, numberOfLines: 1, componentId: props.id + '-title' }, props.title),
    props.action || null
  );
};
var MetricRow = function(props) {
  return React.createElement(TouchableOpacity, {
    style: [styles.row, props.done ? { backgroundColor: surfaceAltColor } : null],
    onPress: props.onPress,
    activeOpacity: 0.7,
    componentId: props.id
  },
    props.checkbox ? React.createElement(View, { style: [styles.checkbox, props.done ? styles.checkboxDone : null], componentId: props.id + '-check' },
      props.done ? React.createElement(Ionicons, { name: 'checkmark', size: 17, color: onAccentColor }) : null
    ) : null,
    props.level ? React.createElement(View, { style: { marginRight: 12 } }, React.createElement(LevelDot, { level: props.level })) : null,
    React.createElement(View, { style: styles.rowCopy, componentId: props.id + '-copy' },
      React.createElement(Text, { style: [styles.rowTitle, props.done ? { color: textSecondary, textDecorationLine: 'line-through' } : null], numberOfLines: 1, componentId: props.id + '-name' }, props.title),
      React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1, componentId: props.id + '-meta' }, props.meta)
    ),
    React.createElement(Text, { style: styles.rowValue, numberOfLines: 1, componentId: props.id + '-value' }, props.value)
  );
};
// @end:shared-helpers

// @section:challenge-components @depends:[styles,shared-helpers]
// Clickable body figure: each marker shows the worst status of the readings
// linked to that body system (the challenge's suggested visual tool).
var BodyMap = function(props) {
  var selectedState = React.useState('heart');
  var rows = props.rows;
  var ranges = props.ranges;
  var levelOf = function(system) {
    return worstLevel(system.indicators.map(function(key) { return levelFor(latestFor(rows, key), key, ranges); }));
  };
  var selected = BODY_SYSTEMS.find(function(system) { return system.key === selectedState[0]; }) || BODY_SYSTEMS[0];
  var line = function(style) { return React.createElement(View, { style: [styles.bodyPart, style] }); };
  return React.createElement(View, { style: styles.readingCard, componentId: 'body-map' },
    React.createElement(Text, { style: styles.rowMeta }, 'Tap a body system to see its readings'),
    React.createElement(View, { style: styles.bodyFigure, accessibilityLabel: 'Body figure with status markers' },
      line({ left: '41%', top: '0%', width: '18%', height: '13%', borderRadius: 999 }),
      line({ left: '33%', top: '15%', width: '34%', height: '38%', borderRadius: 18 }),
      line({ left: '18%', top: '16%', width: '12%', height: '36%', borderRadius: 12 }),
      line({ left: '70%', top: '16%', width: '12%', height: '36%', borderRadius: 12 }),
      line({ left: '35%', top: '55%', width: '13%', height: '43%', borderRadius: 12 }),
      line({ left: '52%', top: '55%', width: '13%', height: '43%', borderRadius: 12 }),
      BODY_SYSTEMS.map(function(system) {
        var level = system.indicators.length ? levelOf(system) : 'none';
        var active = system.key === selected.key;
        return React.createElement(TouchableOpacity, {
          key: system.key,
          onPress: function() { selectedState[1](system.key); },
          activeOpacity: 0.7,
          accessibilityRole: 'button',
          accessibilityLabel: system.label + ', ' + LEVELS[level].label,
          style: [styles.bodyMarker, { left: system.x + '%', top: system.y + '%', backgroundColor: LEVELS[level].color, borderColor: active ? textPrimary : backgroundColor, transform: [{ scale: active ? 1.2 : 1 }] }],
          componentId: 'body-marker-' + system.key
        });
      })
    ),
    React.createElement(View, { style: styles.bodyLegend },
      ['ok', 'watch', 'urgent', 'none'].map(function(key) {
        return React.createElement(View, { key: key, style: styles.legendItem }, React.createElement(LevelDot, { level: key, size: 8 }), React.createElement(Text, { style: [styles.rowMeta, { marginLeft: 4 }] }, LEVELS[key].label));
      })
    ),
    React.createElement(View, { style: [styles.spaceBetween, { marginTop: 12 }] },
      React.createElement(Text, { style: styles.rowTitle }, selected.label),
      selected.indicators.length ? React.createElement(LevelBadge, { level: levelOf(selected) }) : null
    ),
    React.createElement(Text, { style: [styles.secondary, { marginTop: 6 }] }, selected.note),
    selected.indicators.map(function(key) {
      var indicator = INDICATORS.find(function(item) { return item.key === key; });
      var latest = latestFor(rows, key);
      return React.createElement(MetricRow, { key: key, id: 'body-' + key, level: levelFor(latest, key, ranges), title: indicator.title, meta: statusFor(latest, key, ranges), value: reading(latest, key) || '—', onPress: function() { props.navigation.navigate('IndicatorDetail', { indicator: key }); } });
    }),
    selected.guide ? React.createElement(TouchableOpacity, { onPress: function() { props.navigation.navigate('GuidanceDetail', { guide: selected.guide }); }, style: { marginTop: 10 } }, React.createElement(Text, { style: [styles.rowValue, { color: highlightColor }] }, 'Open the guide')) : null,
    React.createElement(TouchableOpacity, { onPress: function() { props.navigation.navigate('LibraryDetail', { topic: selected.library }); }, style: { marginTop: 10 } }, React.createElement(Text, { style: [styles.rowValue, { color: highlightColor }] }, 'Read NASA’s research summary'))
  );
};

// Bar chart of an indicator over time, coloured by status.
var chartValue = function(row, key) {
  if (key === 'pressure') return row.systolic_pressure;
  if (key === 'mood') return { very_low: 1, low: 2, neutral: 3, good: 4, very_good: 5 }[row.mood];
  return row[{ heart: 'heart_rate', glucose: 'blood_sugar', temperature: 'body_temperature', sleep: 'sleep_hours' }[key]];
};
var TrendChart = function(props) {
  var points = props.rows.slice(0, 14).reverse().map(function(row) { return { row: row, value: Number(chartValue(row, props.indicator)) }; }).filter(function(point) { return isFinite(point.value); });
  if (points.length < 2) return React.createElement(Text, { style: [styles.rowMeta, { padding: 12 }] }, 'Record at least two readings to see a trend.');
  var values = points.map(function(point) { return point.value; });
  var min = Math.min.apply(null, values);
  var max = Math.max.apply(null, values);
  var span = max - min || 1;
  return React.createElement(View, { style: { padding: 12 } },
    React.createElement(View, { style: styles.chartArea, accessibilityLabel: 'Trend of the last ' + points.length + ' readings' },
      points.map(function(point, index) {
        var height = 16 + (point.value - min) / span * 84;
        return React.createElement(View, { key: point.row.id || String(index), style: styles.chartColumn },
          React.createElement(View, { style: { height: height + '%', width: '70%', borderRadius: 3, backgroundColor: LEVELS[levelFor(point.row, props.indicator, props.ranges)].color } })
        );
      })
    ),
    React.createElement(View, { style: [styles.spaceBetween, { marginTop: 6 }] },
      React.createElement(Text, { style: styles.rowMeta }, formatDate(points[0].row.recorded_at)),
      React.createElement(Text, { style: styles.rowMeta }, props.indicator === 'pressure' ? 'Systolic, ' + min + '–' + max : props.indicator === 'mood' ? 'Very low to very good' : 'Range shown: ' + min + '–' + max),
      React.createElement(Text, { style: styles.rowMeta }, formatDate(points[points.length - 1].row.recorded_at))
    )
  );
};
// @end:challenge-components

// @section:TodayScreen @depends:[ThemeContext,styles,shared-helpers]
var TodayScreen = function(props) {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var themeContext = useTheme();
  var theme = themeContext.theme;
  var profile = useStorage('orbitwell-profile', DEFAULT_PROFILE)[0];
  var query = useQuery('health_check_ins', {}, { column: 'recorded_at', ascending: false });
  var rows = query.data;
  var today = new Date().toISOString().slice(0, 10);
  var current = rows.find(function(row) { return String(row.recorded_at || '').slice(0, 10) === today; }) || null;
  var done = INDICATORS.filter(function(item) { return !!reading(current, item.key); });
  var due = INDICATORS.filter(function(item) { return !reading(current, item.key); });
  var ranges = useStorage('orbitwell-ranges', DEFAULT_RANGES)[0];
  var environment = environmentFor(profile.environment);
  var lastSeen = function(key) {
    var latest = latestFor(rows, key);
    var days = latest ? daysSince(latest.recorded_at) : null;
    return days == null ? 'Never recorded' : days === 0 ? 'Recorded today' : days === 1 ? 'Last recorded yesterday' : 'Last recorded ' + days + ' days ago';
  };
  var latestLevels = INDICATORS.map(function(item) { return { item: item, level: levelFor(latestFor(rows, item.key), item.key, ranges) }; });
  var attention = latestLevels.filter(function(entry) { return entry.level === 'urgent' || entry.level === 'watch'; });
  var overall = worstLevel(latestLevels.map(function(entry) { return entry.level; }));
  var scrollHeight = windowHeight - insets.top - insets.bottom;
  return React.createElement(View, { style: styles.screen, componentId: 'today-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(ScrollView, {
      style: { height: scrollHeight },
      contentContainerStyle: { paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING },
      componentId: 'today-scroll'
    },
      React.createElement(Text, { style: styles.title, componentId: 'today-title' }, 'Hubble Health Monitor'),
      React.createElement(Text, { style: styles.secondary, componentId: 'today-date' }, 'Your Health. Your Mission. Your Future. · ' + dateLine(profile)),
      React.createElement(TouchableOpacity, { style: [styles.envCard, { marginTop: 16 }], activeOpacity: 0.7, onPress: function() { props.navigation.navigate('Profile'); }, componentId: 'today-environment' },
        React.createElement(Ionicons, { name: 'planet-outline', size: 22, color: highlightColor }),
        React.createElement(View, { style: [styles.rowCopy, { marginLeft: 12 }] },
          React.createElement(Text, { style: styles.rowTitle }, environment.label + ' · ' + environment.gravity),
          React.createElement(Text, { style: styles.rowMeta }, 'Signal to Earth: ' + environment.delay)
        ),
        React.createElement(Ionicons, { name: 'chevron-forward', size: 20, color: textSecondary })
      ),
      rows.length && attention.length ? React.createElement(TouchableOpacity, { style: [styles.alertCard, { borderColor: LEVELS[overall].color }], activeOpacity: 0.7, onPress: function() { props.navigation.navigate('Health'); }, componentId: 'today-attention' },
        React.createElement(View, { style: styles.spaceBetween },
          React.createElement(Text, { style: styles.rowTitle }, NEXT_STEPS[overall].title),
          React.createElement(LevelBadge, { level: overall })
        ),
        React.createElement(Text, { style: [styles.secondary, { marginTop: 6 }] }, attention.map(function(entry) { return entry.item.title + ' (' + LEVELS[entry.level].label.toLowerCase() + ')'; }).join(', ')),
        React.createElement(Text, { style: [styles.body, { marginTop: 8 }] }, NEXT_STEPS[overall].body)
      ) : null,
      query.error ? React.createElement(View, { style: styles.errorBlock, componentId: 'today-error' },
        React.createElement(Ionicons, { name: 'refresh', size: 24, color: highlightColor }),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'today-error-title' }, 'Health readings unavailable'),
        React.createElement(Text, { style: styles.body, componentId: 'today-error-copy' }, 'Your on-device readings could not be loaded. Try again.'),
        React.createElement(TouchableOpacity, { style: styles.button, activeOpacity: 0.7, onPress: query.refetch, componentId: 'today-retry' },
          React.createElement(Text, { style: styles.buttonText }, 'Retry readings')
        )
      ) : rows.length === 0 ? React.createElement(View, { style: styles.emptyBlock, componentId: 'today-empty' },
        React.createElement(View, { style: styles.emptyIcon, componentId: 'today-empty-mark' },
          React.createElement(Ionicons, { name: 'heart-outline', size: 28, color: highlightColor })
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'today-empty-title' }, 'Start your health check-in'),
        React.createElement(Text, { style: styles.emptyCopy, componentId: 'today-empty-copy' }, 'Take a few readings to see how you’re doing and get guidance for today.'),
        React.createElement(TouchableOpacity, { style: [styles.button, { alignSelf: 'stretch', marginTop: 32 }], activeOpacity: 0.7, onPress: function() { props.navigation.navigate('CheckIn'); }, componentId: 'today-begin' },
          React.createElement(Text, { style: styles.buttonText }, 'Begin check-in')
        )
      ) : React.createElement(View, { componentId: 'today-content' },
        React.createElement(View, { style: styles.progressBlock, componentId: 'today-progress' },
          React.createElement(View, { style: styles.progressCopy, componentId: 'today-progress-copy' },
            React.createElement(Text, { style: styles.sectionTitle, componentId: 'today-progress-count' }, done.length + ' of ' + INDICATORS.length),
            React.createElement(Text, { style: styles.secondary, componentId: 'today-progress-label' }, 'daily readings complete')
          ),
          React.createElement(View, { style: styles.progressTrack, componentId: 'today-progress-track' },
            React.createElement(View, { style: { width: (done.length / INDICATORS.length * 100) + '%', height: 4, backgroundColor: accentColor }, componentId: 'today-progress-fill' })
          )
        ),
        React.createElement(Text, { style: styles.sectionHeading, componentId: 'today-due-heading' }, 'To measure'),
        React.createElement(View, { style: styles.card, componentId: 'today-due-list' },
          due.length ? due.map(function(item) {
            return React.createElement(MetricRow, { key: item.key, id: 'today-due-' + item.key, checkbox: true, title: item.title, meta: lastSeen(item.key) + ' · ' + item.hint, value: 'Due', onPress: function() { props.navigation.navigate('CheckIn'); } });
          }) : React.createElement(Text, { style: styles.listEmpty, componentId: 'today-due-empty' }, 'All daily readings recorded.')
        ),
        React.createElement(Text, { style: styles.sectionHeading, componentId: 'today-done-heading' }, 'Completed today'),
        React.createElement(View, { style: styles.card, componentId: 'today-done-list' },
          done.length ? done.map(function(item) {
            return React.createElement(MetricRow, { key: item.key, id: 'today-done-' + item.key, checkbox: true, done: true, title: item.title, meta: statusFor(current, item.key, ranges), value: reading(current, item.key), onPress: function() { props.navigation.navigate('IndicatorDetail', { indicator: item.key }); } });
          }) : React.createElement(Text, { style: styles.listEmpty, componentId: 'today-done-empty' }, 'No readings recorded today.')
        ),
        React.createElement(TouchableOpacity, { style: [styles.button, { marginTop: 24 }], activeOpacity: 0.7, onPress: function() { props.navigation.navigate('CheckIn'); }, componentId: 'today-checkin' },
          React.createElement(Text, { style: styles.buttonText }, 'Open health check-in')
        )
      )
    )
  );
};
// @end:TodayScreen

// @section:CheckInScreen @depends:[ThemeContext,styles,shared-helpers]
var CheckInScreen = function(props) {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var profile = useStorage('orbitwell-profile', DEFAULT_PROFILE)[0];
  var query = useQuery('health_check_ins', {}, { column: 'recorded_at', ascending: false });
  var insert = useMutation('health_check_ins', 'insert');
  var systolicState = React.useState('');
  var diastolicState = React.useState('');
  var heartState = React.useState('');
  var glucoseState = React.useState('');
  var temperatureState = React.useState('');
  var sleepState = React.useState('');
  var moodState = React.useState('');
  var notesState = React.useState('');
  var savingState = React.useState(false);
  var errorState = React.useState('');
  var entries = [
    { label: 'Systolic pressure', hint: 'Seated, rested 5 min', unit: 'mmHg', state: systolicState, decimal: false },
    { label: 'Diastolic pressure', hint: 'Same reading', unit: 'mmHg', state: diastolicState, decimal: false },
    { label: 'Resting heart rate', hint: 'At rest', unit: 'bpm', state: heartState, decimal: false },
    { label: 'Blood glucose', hint: 'Note meal timing', unit: 'mg/dL', state: glucoseState, decimal: true },
    { label: 'Body temperature', hint: 'Oral thermometer', unit: '°C', state: temperatureState, decimal: true },
    { label: 'Sleep', hint: 'Last sleep period', unit: 'hours', state: sleepState, decimal: true }
  ];
  var save = function() {
    if (!entries.some(function(entry) { return !!entry.state[0]; }) && !moodState[0] && !notesState[0].trim()) {
      errorState[1]('Enter at least one reading or mood before reviewing.');
      return;
    }
    savingState[1](true);
    errorState[1]('');
    insert.mutate({
      recorded_at: new Date().toISOString(),
      systolic_pressure: systolicState[0] ? Number(systolicState[0]) : null,
      diastolic_pressure: diastolicState[0] ? Number(diastolicState[0]) : null,
      heart_rate: heartState[0] ? Number(heartState[0]) : null,
      blood_sugar: glucoseState[0] ? Number(glucoseState[0]) : null,
      body_temperature: temperatureState[0] ? Number(temperatureState[0]) : null,
      sleep_hours: sleepState[0] ? Number(sleepState[0]) : null,
      mood: moodState[0] || null,
      notes: notesState[0].trim() || null
    }).then(function(row) {
      savingState[1](false);
      query.refetch();
      props.navigation.replace('HealthReview', { recordId: row && row.id });
    }).catch(function(error) {
      savingState[1](false);
      errorState[1](error.message || 'Could not save this check-in.');
    });
  };
  return React.createElement(View, { style: [styles.screen, { paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }], componentId: 'checkin-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(BackHeader, { id: 'checkin', title: 'Health check-in', onBack: function() { props.navigation.goBack(); } }),
    React.createElement(ScrollView, {
      style: { height: windowHeight - insets.top - insets.bottom - 116 },
      contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING },
      keyboardShouldPersistTaps: 'handled',
      componentId: 'checkin-scroll'
    },
      React.createElement(Text, { style: styles.rowTitle, componentId: 'checkin-person' }, (profile.name || 'Your check-in') + ' · flight day ' + flightDay(profile.missionStart)),
      React.createElement(Text, { style: [styles.secondary, { marginTop: 8, marginBottom: 16 }], componentId: 'checkin-intro' }, 'Take each reading at rest. Follow the instrument prompts, then enter the result.'),
      React.createElement(View, { style: styles.card, componentId: 'checkin-fields' },
        entries.map(function(entry, index) {
          return React.createElement(View, { key: entry.label, style: styles.field, componentId: 'checkin-field-' + index },
            React.createElement(View, { style: styles.fieldTop, componentId: 'checkin-field-top-' + index },
              React.createElement(Text, { style: styles.rowTitle, componentId: 'checkin-label-' + index }, entry.label),
              React.createElement(Text, { style: styles.rowMeta, componentId: 'checkin-hint-' + index }, entry.hint)
            ),
            React.createElement(View, { style: styles.inputWrap, componentId: 'checkin-entry-' + index },
              React.createElement(TextInput, { style: styles.input, value: entry.state[0], onChangeText: function(text) {
                var clean = entry.decimal ? text.replace(/[^0-9.]/g, '') : text.replace(/[^0-9]/g, '');
                if (entry.decimal) {
                  var parts = clean.split('.');
                  if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');
                }
                entry.state[1](clean);
              }, placeholder: 'Enter reading', placeholderTextColor: textSecondary, keyboardType: entry.decimal ? 'decimal-pad' : 'numeric', autoCapitalize: 'none', autoCorrect: false, componentId: 'checkin-input-' + index }),
              React.createElement(Text, { style: styles.rowMeta, componentId: 'checkin-unit-' + index }, entry.unit)
            )
          );
        }),
        React.createElement(View, { style: styles.field, componentId: 'checkin-mood-field' },
          React.createElement(Text, { style: [styles.rowTitle, { marginBottom: 12 }], componentId: 'checkin-mood-label' }, 'Mood · How are you feeling?'),
          React.createElement(View, { style: styles.moodRow, componentId: 'checkin-mood-options' },
            [{ id: 'very_low', label: 'Very low' }, { id: 'low', label: 'Low' }, { id: 'neutral', label: 'Steady' }, { id: 'good', label: 'Good' }, { id: 'very_good', label: 'Very good' }].map(function(option) {
              return React.createElement(TouchableOpacity, { key: option.id, style: [styles.moodOption, moodState[0] === option.id ? { backgroundColor: accentSoftColor } : null], activeOpacity: 0.7, onPress: function() { moodState[1](option.id); }, componentId: 'checkin-mood-' + option.id },
                React.createElement(Text, { style: [styles.rowMeta, moodState[0] === option.id ? { color: highlightColor, fontWeight: '600' } : null] }, option.label)
              );
            })
          )
        ),
        React.createElement(View, { style: styles.field, componentId: 'checkin-notes-field' },
          React.createElement(Text, { style: [styles.rowTitle, { marginBottom: 8 }], componentId: 'checkin-notes-label' }, 'Notes'),
          React.createElement(TextInput, { style: [styles.inputWrap, { minHeight: 88, padding: 12 }], value: notesState[0], onChangeText: notesState[1], placeholder: 'Symptoms or context to remember', placeholderTextColor: textSecondary, multiline: true, numberOfLines: 4, textAlignVertical: 'top', autoCapitalize: 'sentences', autoCorrect: true, componentId: 'checkin-notes-input' })
        )
      ),
      errorState[0] ? React.createElement(Text, { style: [styles.secondary, { marginTop: 12 }], componentId: 'checkin-error' }, errorState[0]) : null
    ),
    React.createElement(TouchableOpacity, { style: styles.button, activeOpacity: 0.7, disabled: savingState[0], onPress: save, componentId: 'checkin-review-button' },
      React.createElement(Text, { style: styles.buttonText }, savingState[0] ? 'Saving…' : 'Review readings')
    )
  );
};
// @end:CheckInScreen

// @section:HealthReviewScreen @depends:[ThemeContext,styles,shared-helpers]
var HealthReviewScreen = function(props) {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var profile = useStorage('orbitwell-profile', DEFAULT_PROFILE)[0];
  var ranges = useStorage('orbitwell-ranges', DEFAULT_RANGES)[0];
  var query = useQuery('health_check_ins', {}, { column: 'recorded_at', ascending: false });
  var id = props.route && props.route.params ? props.route.params.recordId : null;
  var row = query.data.find(function(item) { return item.id === id; }) || query.data[0] || null;
  var pressure = reading(row, 'pressure');
  var overall = worstLevel(INDICATORS.map(function(item) { return levelFor(row, item.key, ranges); }));
  var step = NEXT_STEPS[overall];
  return React.createElement(View, { style: [styles.screen, { paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }], componentId: 'review-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(BackHeader, { id: 'review', title: 'Health review', onBack: function() { props.navigation.goBack(); } }),
    React.createElement(ScrollView, { style: { height: windowHeight - insets.top - insets.bottom - 116 }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING }, componentId: 'review-scroll' },
      React.createElement(Text, { style: [styles.secondary, { marginBottom: 16 }], componentId: 'review-date' }, (profile.name || 'Your check-in') + ' · ' + dateLine(profile)),
      React.createElement(View, { style: styles.readingCard, componentId: 'review-pressure-card' },
        React.createElement(Text, { style: styles.overline, componentId: 'review-pressure-label' }, 'BLOOD PRESSURE'),
        React.createElement(Text, { style: styles.bigNumber, componentId: 'review-pressure-value' }, pressure || 'Not recorded'),
        React.createElement(Text, { style: styles.secondary, componentId: 'review-pressure-unit' }, 'mmHg · measured seated'),
        React.createElement(View, { style: styles.statusRow, componentId: 'review-status' },
          React.createElement(LevelDot, { level: levelFor(row, 'pressure', ranges) }),
          React.createElement(Text, { style: styles.rowTitle, componentId: 'review-status-text' }, statusFor(row, 'pressure', ranges))
        ),
        React.createElement(Text, { style: styles.secondary, componentId: 'review-range' }, 'Personal range: ' + ranges.systolic + ' / ' + ranges.diastolic + ' mmHg')
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'review-readings-heading' }, 'This check-in'),
      React.createElement(View, { style: styles.card, componentId: 'review-readings' },
        INDICATORS.filter(function(item) { return item.key !== 'pressure' && !!reading(row, item.key); }).map(function(item) {
          return React.createElement(MetricRow, { key: item.key, id: 'review-' + item.key, level: levelFor(row, item.key, ranges), title: item.title, meta: statusFor(row, item.key, ranges), value: reading(row, item.key), onPress: function() { props.navigation.navigate('IndicatorDetail', { indicator: item.key }); } });
        }),
        !row ? React.createElement(Text, { style: styles.listEmpty, componentId: 'review-empty' }, 'No readings available yet.') : null
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'review-next-heading' }, 'Suggested next step'),
      React.createElement(View, { style: [styles.callout, overall === 'urgent' || overall === 'watch' ? { borderWidth: 1, borderColor: LEVELS[overall].color } : null], componentId: 'review-guidance' },
        React.createElement(View, { style: styles.spaceBetween },
          React.createElement(Text, { style: styles.rowTitle, componentId: 'review-guidance-title' }, step.title),
          React.createElement(LevelBadge, { level: overall })
        ),
        React.createElement(Text, { style: [styles.body, { marginTop: 8 }], componentId: 'review-guidance-copy' }, step.body + ' These labels compare readings with your personal ranges and are not a diagnosis.'),
        React.createElement(Text, { style: [styles.rowMeta, { marginTop: 8 }] }, ALERT_LIMITS_NOTE)
      )
    ),
    React.createElement(TouchableOpacity, { style: [styles.button, { backgroundColor: primaryColor }], activeOpacity: 0.7, onPress: function() { props.navigation.navigate('CheckIn'); }, componentId: 'review-repeat-button' },
      React.createElement(Text, { style: styles.buttonText }, 'Log another reading')
    )
  );
};
// @end:HealthReviewScreen

// @section:HealthScreen @depends:[ThemeContext,styles,shared-helpers]
var HealthScreen = function(props) {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var profile = useStorage('orbitwell-profile', DEFAULT_PROFILE)[0];
  var ranges = useStorage('orbitwell-ranges', DEFAULT_RANGES)[0];
  var query = useQuery('health_check_ins', {}, { column: 'recorded_at', ascending: false });
  var rows = query.data;
  var pressureRow = latestFor(rows, 'pressure');
  var pressures = rows.filter(function(row) { return !!reading(row, 'pressure'); }).slice(0, 7).reverse();
  return React.createElement(View, { style: styles.screen, componentId: 'health-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(ScrollView, { style: { height: windowHeight - insets.top - insets.bottom }, contentContainerStyle: { paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING }, componentId: 'health-scroll' },
      React.createElement(Text, { style: styles.title, componentId: 'health-title' }, 'Health dashboard'),
      rows.length === 0 ? React.createElement(View, { style: styles.emptyBlock, componentId: 'health-empty' },
        React.createElement(View, { style: styles.orbitMark, componentId: 'health-orbit' }, React.createElement(View, { style: styles.orbitCore, componentId: 'health-orbit-core' }, React.createElement(View, { style: styles.orbitDot, componentId: 'health-orbit-dot' }))),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'health-empty-title' }, 'Your health picture starts with a check-in'),
        React.createElement(Text, { style: styles.emptyCopy, componentId: 'health-empty-copy' }, 'Record a few readings to see your health trends and indicator history here.'),
        React.createElement(TouchableOpacity, { style: [styles.button, { alignSelf: 'stretch', marginTop: 32 }], activeOpacity: 0.7, onPress: function() { props.navigation.navigate('CheckIn'); }, componentId: 'health-start' }, React.createElement(Text, { style: styles.buttonText }, 'Start health check-in'))
      ) : React.createElement(View, { componentId: 'health-content' },
        React.createElement(Text, { style: [styles.rowTitle, { marginTop: 12 }], componentId: 'health-person' }, profile.name || 'Your health'),
        React.createElement(Text, { style: styles.secondary, componentId: 'health-context' }, dateLine(profile) + ' · latest ' + formatDate(rows[0]?.recorded_at)),
        React.createElement(Text, { style: styles.sectionHeading, componentId: 'health-body-heading' }, 'Body status'),
        React.createElement(BodyMap, { rows: rows, ranges: ranges, navigation: props.navigation }),
        React.createElement(TouchableOpacity, { style: [styles.readingCard, { marginTop: 20 }], activeOpacity: 0.7, onPress: function() { props.navigation.navigate('IndicatorDetail', { indicator: 'pressure' }); }, componentId: 'health-pressure-card' },
          React.createElement(View, { style: styles.spaceBetween, componentId: 'health-pressure-top' },
            React.createElement(Text, { style: styles.rowMeta, componentId: 'health-pressure-label' }, 'Blood pressure · last ' + pressures.length + ' readings'),
            React.createElement(LevelBadge, { level: levelFor(pressureRow, 'pressure', ranges) })
          ),
          React.createElement(Text, { style: styles.bigNumber, componentId: 'health-pressure-value' }, reading(pressureRow, 'pressure') || 'Not recorded'),
          React.createElement(Text, { style: styles.secondary, componentId: 'health-pressure-unit' }, 'mmHg'),
          React.createElement(View, { style: styles.trendRow, componentId: 'health-trend' },
            pressures.length ? pressures.map(function(row, index) {
              return React.createElement(View, { key: row.id || String(index), style: [styles.trendBar, { height: Math.max(8, Math.min(32, Number(row.systolic_pressure || 100) - 95)), backgroundColor: LEVELS[levelFor(row, 'pressure', ranges)].color }], componentId: 'health-trend-bar-' + index });
            }) : React.createElement(Text, { style: styles.rowMeta, componentId: 'health-trend-empty' }, 'No pressure readings yet')
          )
        ),
        React.createElement(Text, { style: styles.sectionHeading, componentId: 'health-indicators-heading' }, 'Recent indicators'),
        React.createElement(View, { style: styles.card, componentId: 'health-indicators' },
          INDICATORS.filter(function(item) { return item.key !== 'pressure'; }).map(function(item) {
            var latest = latestFor(rows, item.key);
            return React.createElement(MetricRow, { key: item.key, id: 'health-' + item.key, level: levelFor(latest, item.key, ranges), title: item.title, meta: statusFor(latest, item.key, ranges), value: reading(latest, item.key) || '—', onPress: function() { props.navigation.navigate('IndicatorDetail', { indicator: item.key }); } });
          })
        ),
        React.createElement(Text, { style: [styles.secondary, { marginTop: 16 }], componentId: 'health-trend-note' }, 'Trends help spot changes; they do not diagnose a condition. Use your mission protocol and consult crew medical support.')
      )
    )
  );
};
// @end:HealthScreen

// @section:IndicatorDetailScreen @depends:[ThemeContext,styles,shared-helpers]
var IndicatorDetailScreen = function(props) {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var profile = useStorage('orbitwell-profile', DEFAULT_PROFILE)[0];
  var ranges = useStorage('orbitwell-ranges', DEFAULT_RANGES)[0];
  var query = useQuery('health_check_ins', {}, { column: 'recorded_at', ascending: false });
  var key = props.route && props.route.params ? props.route.params.indicator : 'pressure';
  var indicator = INDICATORS.find(function(item) { return item.key === key; }) || INDICATORS[0];
  var rows = query.data.filter(function(row) { return !!reading(row, indicator.key); });
  var latest = rows[0] || null;
  var context = INDICATOR_CONTEXT[indicator.key];
  var reference = { pressure: ranges.systolic + ' / ' + ranges.diastolic, heart: ranges.heart, glucose: ranges.glucose, temperature: ranges.temperature, sleep: ranges.sleep, mood: 'Personal pattern' }[indicator.key];
  return React.createElement(View, { style: [styles.screen, { paddingTop: insets.top, paddingHorizontal: 16 }], componentId: 'indicator-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(BackHeader, { id: 'indicator', title: 'Indicator details', onBack: function() { props.navigation.goBack(); } }),
    React.createElement(ScrollView, { style: { height: windowHeight - insets.top - insets.bottom - 48 }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING }, componentId: 'indicator-scroll' },
      React.createElement(Text, { style: styles.title, componentId: 'indicator-title' }, indicator.title),
      React.createElement(Text, { style: styles.secondary, componentId: 'indicator-subtitle' }, (profile.name || 'Your readings') + ' · flight day ' + flightDay(profile.missionStart)),
      React.createElement(View, { style: styles.statusRow, componentId: 'indicator-status' },
        React.createElement(LevelDot, { level: levelFor(latest, indicator.key, ranges) }),
        React.createElement(Text, { style: [styles.rowTitle, { flex: 1 }], componentId: 'indicator-status-text' }, statusFor(latest, indicator.key, ranges)),
        React.createElement(Text, { style: styles.rowMeta, componentId: 'indicator-status-date' }, latest ? formatDate(latest.recorded_at) : '')
      ),
      React.createElement(View, { style: styles.readingCard, componentId: 'indicator-reading-card' },
        React.createElement(Text, { style: styles.rowMeta, componentId: 'indicator-reading-label' }, 'Latest reading'),
        React.createElement(Text, { style: styles.bigNumber, componentId: 'indicator-reading-value' }, reading(latest, indicator.key) || '—'),
        React.createElement(View, { style: [styles.spaceBetween, styles.referenceLine], componentId: 'indicator-reference' },
          React.createElement(Text, { style: styles.secondary, componentId: 'indicator-reference-label' }, 'Personal reference range'),
          React.createElement(Text, { style: styles.rowValue, componentId: 'indicator-reference-value' }, reference || '—')
        )
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'indicator-trend-heading' }, 'Trend over time'),
      React.createElement(View, { style: styles.card, componentId: 'indicator-trend' }, React.createElement(TrendChart, { rows: rows, indicator: indicator.key, ranges: ranges })),
      context ? React.createElement(Text, { style: styles.sectionHeading, componentId: 'indicator-space-heading' }, 'Why it matters in space') : null,
      context ? React.createElement(View, { style: styles.callout, componentId: 'indicator-space' },
        React.createElement(Text, { style: styles.rowMeta }, 'NASA hazard: ' + context.hazards.join(', ')),
        React.createElement(Text, { style: [styles.body, { marginTop: 8 }] }, context.space),
        React.createElement(Text, { style: [styles.rowTitle, { marginTop: 12 }] }, 'Can it be measured in space?'),
        React.createElement(Text, { style: [styles.secondary, { marginTop: 4 }] }, context.canMeasure),
        React.createElement(Text, { style: [styles.rowTitle, { marginTop: 12 }] }, 'What to do now'),
        React.createElement(Text, { style: [styles.secondary, { marginTop: 4 }] }, NEXT_STEPS[levelFor(latest, indicator.key, ranges)].body),
        React.createElement(TouchableOpacity, { onPress: function() { props.navigation.navigate('LibraryDetail', { topic: context.library }); }, style: { marginTop: 12 } }, React.createElement(Text, { style: [styles.rowValue, { color: highlightColor }] }, 'Read the source summary')),
        React.createElement(TouchableOpacity, { onPress: function() { openSource(context.source); }, style: { marginTop: 8 } }, React.createElement(Text, { style: [styles.rowMeta, { color: highlightColor }] }, 'Source: ' + context.source))
      ) : null,
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'indicator-history-heading' }, 'Recent readings'),
      React.createElement(View, { style: styles.card, componentId: 'indicator-history' },
        rows.length ? rows.slice(0, 12).map(function(row, index) {
          return React.createElement(MetricRow, { key: row.id || String(index), id: 'indicator-history-' + index, level: levelFor(row, indicator.key, ranges), title: formatDate(row.recorded_at), meta: row.notes || 'Recorded check-in', value: reading(row, indicator.key), onPress: function() {} });
        }) : React.createElement(Text, { style: styles.listEmpty, componentId: 'indicator-history-empty' }, 'No readings for this indicator yet.')
      ),
      React.createElement(Text, { style: [styles.secondary, { marginTop: 16, lineHeight: 20 }], componentId: 'indicator-note' }, 'Compare repeated readings with your mission-specific baseline. Contact the crew medical officer if results remain outside your range or you have concerning symptoms. This is not a diagnosis.')
    )
  );
};
// @end:IndicatorDetailScreen

// @section:MeasuresScreen @depends:[ThemeContext,styles,shared-helpers]
var MeasuresScreen = function(props) {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var guideRow = function(item) {
    return React.createElement(TouchableOpacity, { key: item.key, style: styles.guideRow, activeOpacity: 0.7, onPress: function() { props.navigation.navigate('GuidanceDetail', { guide: item.key }); }, componentId: 'measures-guide-' + item.key },
      React.createElement(View, { style: styles.guideIcon, componentId: 'measures-icon-' + item.key }, React.createElement(Ionicons, { name: item.icon, size: 24, color: highlightColor })),
      React.createElement(View, { style: styles.rowCopy, componentId: 'measures-copy-' + item.key },
        React.createElement(Text, { style: styles.rowTitle, numberOfLines: 1, componentId: 'measures-name-' + item.key }, item.title),
        React.createElement(Text, { style: styles.rowMeta, numberOfLines: 1, componentId: 'measures-hint-' + item.key }, item.hint)
      ),
      React.createElement(Ionicons, { name: 'chevron-forward', size: 24, color: textSecondary })
    );
  };
  return React.createElement(View, { style: styles.screen, componentId: 'measures-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(ScrollView, { style: { height: windowHeight - insets.top - insets.bottom }, contentContainerStyle: { paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING }, componentId: 'measures-scroll' },
      React.createElement(Text, { style: styles.sectionTitle, componentId: 'measures-title' }, 'Mission guidance'),
      React.createElement(Text, { style: [styles.secondary, { marginTop: 16, marginBottom: 20 }], componentId: 'measures-intro' }, 'Practical routines and offline-ready guidance for health changes during long-duration missions.'),
      React.createElement(Text, { style: styles.sectionTitle, componentId: 'measures-measurements-heading' }, 'Measurements'),
      React.createElement(View, { style: [styles.card, { marginTop: 8 }], componentId: 'measures-measurements' }, GUIDES.slice(0, 5).map(guideRow)),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'measures-concerns-heading' }, 'Spaceflight health risks'),
      React.createElement(View, { style: styles.card, componentId: 'measures-concerns' }, GUIDES.slice(5).map(guideRow)),
      React.createElement(TouchableOpacity, { style: [styles.callout, { marginTop: 20 }], activeOpacity: 0.7, onPress: function() { props.navigation.navigate('LibraryDetail', { topic: 'hazards' }); }, componentId: 'measures-hazards-card' },
        React.createElement(Text, { style: styles.rowTitle, componentId: 'measures-hazards-title' }, 'Five hazards, one daily routine'),
        React.createElement(Text, { style: [styles.body, { marginTop: 8 }], componentId: 'measures-hazards-copy' }, 'Radiation, isolation and confinement, distance from Earth, altered gravity, and a hostile closed environment can affect physical and behavioral health. Keep consistent measures, follow approved countermeasures, and report sustained changes.'),
        React.createElement(Text, { style: [styles.rowValue, { marginTop: 12, color: highlightColor }], componentId: 'measures-hazards-link' }, 'Learn how each hazard links to your readings ›')
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'measures-library-heading' }, 'Space health library'),
      React.createElement(Text, { style: [styles.secondary, { marginBottom: 8 }], componentId: 'measures-library-intro' }, 'Plain-language summaries of public NASA and Canadian Space Agency resources, with links to the original pages.'),
      React.createElement(View, { style: styles.card, componentId: 'measures-library' }, LIBRARY.map(function(item) {
        return React.createElement(TouchableOpacity, { key: item.key, style: styles.guideRow, activeOpacity: 0.7, onPress: function() { props.navigation.navigate('LibraryDetail', { topic: item.key }); }, componentId: 'measures-library-' + item.key },
          React.createElement(View, { style: styles.guideIcon }, React.createElement(Ionicons, { name: item.icon, size: 24, color: highlightColor })),
          React.createElement(View, { style: styles.rowCopy },
            React.createElement(Text, { style: styles.rowTitle, numberOfLines: 1 }, item.title),
            React.createElement(Text, { style: styles.rowMeta, numberOfLines: 2 }, item.agency + ' · ' + item.hint)
          ),
          React.createElement(Ionicons, { name: 'chevron-forward', size: 24, color: textSecondary })
        );
      })),
      React.createElement(Text, { style: [styles.rowMeta, { marginTop: 12 }], componentId: 'measures-library-disclaimer' }, 'Not affiliated with or endorsed by NASA or the CSA.'),
      React.createElement(Text, { style: [styles.rowMeta, { marginTop: 16 }], componentId: 'measures-offline-note' }, 'Guidance is available on this device. Follow mission protocols and your flight surgeon’s advice.')
    )
  );
};
// @end:MeasuresScreen

// @section:GuidanceDetailScreen @depends:[ThemeContext,styles,shared-helpers]
var GuidanceDetailScreen = function(props) {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var profile = useStorage('orbitwell-profile', DEFAULT_PROFILE)[0];
  var key = props.route && props.route.params ? props.route.params.guide : 'pressure';
  var guide = GUIDES.find(function(item) { return item.key === key; }) || GUIDES[0];
  var contact = function() { showMessage('Crew medical support', 'Use your mission’s established crew medical officer or flight surgeon contact procedure. For severe or sudden symptoms, seek help promptly.'); };
  return React.createElement(View, { style: [styles.screen, { paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }], componentId: 'guide-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(BackHeader, { id: 'guide', title: 'Measurement guide', onBack: function() { props.navigation.goBack(); }, action: React.createElement(TouchableOpacity, { style: [styles.backButton, { backgroundColor: accentSoftColor, borderRadius: radiusSm }], activeOpacity: 0.7, onPress: contact, componentId: 'guide-contact' }, React.createElement(Ionicons, { name: 'call-outline', size: 24, color: highlightColor })) }),
    React.createElement(ScrollView, { style: { height: windowHeight - insets.top - insets.bottom - 116 }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING }, componentId: 'guide-scroll' },
      React.createElement(View, { style: styles.readingCard, componentId: 'guide-intro-card' },
        React.createElement(Text, { style: styles.title, componentId: 'guide-title' }, guide.title),
        React.createElement(Text, { style: [styles.body, { color: textSecondary, marginTop: 8 }], componentId: 'guide-lede' }, (profile.name ? profile.name + ' · ' : '') + guide.hint + '. Compare changes with your personal flight baseline.')
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'guide-steps-heading' }, 'Before you measure'),
      React.createElement(View, { style: styles.card, componentId: 'guide-steps' },
        guide.steps.map(function(step, index) {
          return React.createElement(View, { key: String(index), style: styles.guideStep, componentId: 'guide-step-' + index },
            React.createElement(View, { style: styles.stepNumber, componentId: 'guide-step-number-' + index }, React.createElement(Text, { style: styles.rowValue }, String(index + 1))),
            React.createElement(View, { style: styles.rowCopy, componentId: 'guide-step-copy-' + index },
              React.createElement(Text, { style: styles.rowTitle, componentId: 'guide-step-title-' + index }, step[0]),
              React.createElement(Text, { style: [styles.secondary, { marginTop: 4 }], componentId: 'guide-step-detail-' + index }, step[1])
            )
          );
        })
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'guide-help-heading' }, 'When to get help'),
      React.createElement(View, { style: styles.callout, componentId: 'guide-help' },
        React.createElement(Text, { style: styles.rowTitle, componentId: 'guide-help-title' }, 'Contact crew medical support'),
        React.createElement(Text, { style: [styles.secondary, { color: textPrimary, marginTop: 8 }], componentId: 'guide-help-copy' }, 'If a result is outside your mission-specific limits, repeat it as directed and report the readings. Seek support promptly for severe symptoms, chest pain, faintness, or trouble breathing.'),
        React.createElement(Text, { style: [styles.rowValue, { marginTop: 12 }], componentId: 'guide-help-range' }, 'Use your flight surgeon’s thresholds')
      ),
      React.createElement(Text, { style: [styles.rowMeta, { marginTop: 16 }], componentId: 'guide-note' }, 'Spaceflight conditions can change personal baselines. Your care team’s guidance takes priority over general ranges.')
    ),
    React.createElement(TouchableOpacity, { style: styles.button, activeOpacity: 0.7, onPress: function() { props.navigation.navigate('CheckIn'); }, componentId: 'guide-record' }, React.createElement(Text, { style: styles.buttonText }, 'Record a reading'))
  );
};
// @end:GuidanceDetailScreen

// @section:LibraryDetailScreen @depends:[ThemeContext,styles,shared-helpers]
var openSource = function(url) {
  Linking.openURL(url).catch(function() { showMessage('Link unavailable', 'Open this address in your browser: ' + url); });
};
var LibraryDetailScreen = function(props) {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var key = props.route && props.route.params ? props.route.params.topic : 'hazards';
  var topic = LIBRARY.find(function(item) { return item.key === key; }) || LIBRARY[0];
  var follow = function(link) {
    if (link.indicator) props.navigation.navigate('IndicatorDetail', { indicator: link.indicator });
    else if (link.guide) props.navigation.navigate('GuidanceDetail', { guide: link.guide });
    else if (link.library) props.navigation.push('LibraryDetail', { topic: link.library });
    else if (link.tab) props.navigation.navigate('Main', { screen: link.tab });
  };
  return React.createElement(View, { style: [styles.screen, { paddingTop: insets.top, paddingHorizontal: 16 }], componentId: 'library-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(BackHeader, { id: 'library', title: 'Space health library', onBack: function() { props.navigation.goBack(); } }),
    React.createElement(ScrollView, { style: { height: windowHeight - insets.top - insets.bottom - 48 }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING }, componentId: 'library-scroll' },
      React.createElement(View, { style: styles.readingCard, componentId: 'library-intro-card' },
        React.createElement(Text, { style: styles.overline, componentId: 'library-agency' }, 'SUMMARY · ' + topic.agency.toUpperCase()),
        React.createElement(Text, { style: [styles.title, { marginTop: 8 }], componentId: 'library-title' }, topic.title),
        React.createElement(Text, { style: [styles.body, { color: textSecondary, marginTop: 8 }], componentId: 'library-intro' }, topic.intro)
      ),
      topic.sections.map(function(section, index) {
        return React.createElement(View, { key: String(index), style: [styles.card, { marginTop: 12, padding: 16 }], componentId: 'library-section-' + index },
          React.createElement(Text, { style: styles.rowTitle }, section.title),
          React.createElement(Text, { style: [styles.body, { marginTop: 6, color: textSecondary }] }, section.body),
          section.track && section.track.length ? React.createElement(View, { style: { marginTop: 12 } },
            React.createElement(Text, { style: [styles.overline, { marginBottom: 8 }] }, 'IN HUBBLE HEALTH'),
            React.createElement(View, { style: styles.bodyChips }, section.track.map(function(link, linkIndex) {
              return React.createElement(TouchableOpacity, { key: String(linkIndex), style: [styles.bodyChip, { paddingVertical: 8, paddingHorizontal: 12 }], activeOpacity: 0.7, onPress: function() { follow(link); }, componentId: 'library-track-' + index + '-' + linkIndex },
                React.createElement(Text, { style: [styles.rowMeta, { color: highlightColor, fontWeight: '600' }] }, link.label + ' ›')
              );
            }))
          ) : null
        );
      }),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'library-sources-heading' }, 'Read the original'),
      React.createElement(View, { style: styles.card, componentId: 'library-sources' }, topic.sources.map(function(source, index) {
        return React.createElement(TouchableOpacity, { key: source.url, style: styles.guideRow, activeOpacity: 0.7, onPress: function() { openSource(source.url); }, componentId: 'library-source-' + index },
          React.createElement(View, { style: styles.rowCopy },
            React.createElement(Text, { style: styles.rowTitle }, source.label),
            React.createElement(Text, { style: styles.rowMeta, selectable: true }, source.url)
          ),
          React.createElement(Ionicons, { name: 'open-outline', size: 22, color: highlightColor })
        );
      })),
      React.createElement(Text, { style: [styles.rowMeta, { marginTop: 16, lineHeight: 18 }], componentId: 'library-disclaimer' }, LIBRARY_DISCLAIMER),
      React.createElement(Text, { style: [styles.rowMeta, { marginTop: 8, lineHeight: 18 }], componentId: 'library-medical-note' }, 'This information is general education, not medical advice. Follow your care team’s guidance.')
    )
  );
};
// @end:LibraryDetailScreen

// @section:ProfileScreen @depends:[ThemeContext,styles]
var confirmDeleteAll = function() {
  var message = 'This permanently removes your check-ins, photos, notes, reflections, profile and ranges from this device.';
  if (Platform.OS === 'web') {
    if (typeof window.confirm !== 'function' || window.confirm(message)) clearAllData();
    return;
  }
  Alert.alert('Delete all data?', message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: function() { clearAllData(); } }
  ]);
};
var ProfileScreen = function() {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var profileState = useStorage('orbitwell-profile', DEFAULT_PROFILE);
  var rangesState = useStorage('orbitwell-ranges', DEFAULT_RANGES);
  var profile = profileState[0];
  var setProfile = profileState[1];
  var ranges = rangesState[0];
  var setRanges = rangesState[1];
  var fields = [
    { key: 'systolic', label: 'Systolic pressure', unit: 'mmHg' },
    { key: 'diastolic', label: 'Diastolic pressure', unit: 'mmHg' },
    { key: 'heart', label: 'Resting heart rate', unit: 'bpm' },
    { key: 'glucose', label: 'Blood glucose', unit: 'mg/dL' },
    { key: 'temperature', label: 'Body temperature', unit: '°C' },
    { key: 'sleep', label: 'Sleep duration', unit: 'hours' }
  ];
  return React.createElement(View, { style: styles.screen, componentId: 'profile-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(ScrollView, { style: { height: windowHeight - insets.top - insets.bottom }, contentContainerStyle: { paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING }, keyboardShouldPersistTaps: 'handled', componentId: 'profile-scroll' },
      React.createElement(Text, { style: styles.title, componentId: 'profile-title' }, 'Profile'),
      React.createElement(Text, { style: [styles.secondary, { marginTop: 8 }], componentId: 'profile-intro' }, 'Keep mission details and personal reference ranges current. Confirm ranges with your medical team.'),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'profile-mission-heading' }, 'Mission details'),
      React.createElement(View, { style: styles.card, componentId: 'profile-mission-card' },
        React.createElement(View, { style: styles.field, componentId: 'profile-name-field' },
          React.createElement(Text, { style: styles.rowTitle, componentId: 'profile-name-label' }, 'Name'),
          React.createElement(TextInput, { style: [styles.inputWrap, { marginTop: 8, paddingHorizontal: 12 }], value: profile.name || '', onChangeText: function(text) { setProfile(function(prev) { return Object.assign({}, prev, { name: text }); }); }, placeholder: 'Your name', placeholderTextColor: textSecondary, autoCapitalize: 'words', autoCorrect: false, componentId: 'profile-name-input' })
        ),
        React.createElement(View, { style: styles.field, componentId: 'profile-departure-field' },
          React.createElement(Text, { style: styles.rowTitle, componentId: 'profile-departure-label' }, 'Mission departure date'),
          Platform.OS === 'web'
            ? React.createElement('input', { type: 'date', value: profile.missionStart || '', onChange: function(event) { setProfile(function(prev) { return Object.assign({}, prev, { missionStart: event.target.value }); }); }, style: { marginTop: 8, height: 48, width: '100%', boxSizing: 'border-box', colorScheme: 'dark', padding: 12, backgroundColor: backgroundColor, color: textPrimary, border: '1px solid ' + borderColor, borderRadius: radiusSm, fontSize: 16 }, componentId: 'profile-date-input' })
            : React.createElement(View, { style: [styles.inputWrap, { marginTop: 8, paddingHorizontal: 12 }], componentId: 'profile-date-display' }, React.createElement(Text, { style: styles.secondary, componentId: 'profile-date-text' }, profile.missionStart || 'Set departure date in the web editor'))
        )
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'profile-environment-heading' }, 'Mission environment'),
      React.createElement(View, { style: [styles.card, { padding: 12 }], componentId: 'profile-environment' },
        React.createElement(View, { style: styles.bodyChips },
          ENVIRONMENTS.map(function(env) {
            var active = (profile.environment || 'station') === env.key;
            return React.createElement(TouchableOpacity, { key: env.key, style: [styles.bodyChip, active ? { backgroundColor: accentSoftColor, borderColor: accentColor } : null], activeOpacity: 0.7, accessibilityRole: 'button', accessibilityState: { selected: active }, onPress: function() { setProfile(function(prev) { return Object.assign({}, prev, { environment: env.key }); }); }, componentId: 'profile-env-' + env.key },
              React.createElement(Text, { style: [styles.rowValue, active ? { color: highlightColor } : null] }, env.label)
            );
          })
        ),
        React.createElement(Text, { style: [styles.rowTitle, { marginTop: 12 }] }, environmentFor(profile.environment).gravity + ' · ' + environmentFor(profile.environment).delay),
        React.createElement(Text, { style: [styles.secondary, { marginTop: 6 }] }, environmentFor(profile.environment).note)
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'profile-ranges-heading' }, 'Personal reference ranges'),
      React.createElement(View, { style: styles.card, componentId: 'profile-ranges' },
        fields.map(function(field) {
          return React.createElement(View, { key: field.key, style: styles.field, componentId: 'profile-range-' + field.key },
            React.createElement(View, { style: styles.fieldTop, componentId: 'profile-range-top-' + field.key },
              React.createElement(Text, { style: styles.rowTitle, componentId: 'profile-range-label-' + field.key }, field.label),
              React.createElement(Text, { style: styles.rowMeta, componentId: 'profile-range-unit-' + field.key }, field.unit)
            ),
            React.createElement(TextInput, { style: [styles.inputWrap, { paddingHorizontal: 12 }], value: ranges[field.key] || '', onChangeText: function(text) {
              var clean = text.replace(/[^0-9.–-]/g, '');
              setRanges(function(prev) { return Object.assign({}, prev, { [field.key]: clean }); });
            }, placeholder: 'Lower–upper', placeholderTextColor: textSecondary, autoCapitalize: 'none', autoCorrect: false, componentId: 'profile-range-input-' + field.key })
          );
        })
      ),
      React.createElement(Text, { style: [styles.secondary, { marginTop: 16 }], componentId: 'profile-disclaimer' }, 'Reference ranges support noticing changes; they do not diagnose a condition. Follow mission medical protocols and your flight surgeon’s advice.'),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'profile-data-heading' }, 'Your data'),
      React.createElement(View, { style: [styles.card, { padding: 12 }], componentId: 'profile-data-card' },
        React.createElement(Text, { style: styles.secondary, componentId: 'profile-data-copy' }, 'Everything you enter is stored only on this device. Nothing is sent to a server.'),
        React.createElement(TouchableOpacity, { style: [styles.button, { marginTop: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF7A7A' }], activeOpacity: 0.7, onPress: confirmDeleteAll, componentId: 'profile-delete-data' },
          React.createElement(Text, { style: [styles.buttonText, { color: '#FF9C9C' }] }, 'Delete all my data')
        )
      )
    )
  );
};
// @end:ProfileScreen

// @section:MissionScreen @depends:[ThemeContext,styles,shared-helpers]
var MissionScreen = function() {
  var insets = useSafeAreaInsets();
  var windowHeight = useWindowDimensions().height;
  var camera = useCamera();
  var bluetooth = useBluetooth();
  var scanState = React.useState(false);
  var setScanState = scanState[1];
  var scanMessageState = React.useState('');
  var setScanMessageState = scanMessageState[1];
  var foodDraftState = React.useState('');
  var ventDraftState = React.useState('');
  var bodyState = React.useState('Heart');
  var nutritionState = useStorage('orbitwell-nutrition-log', []);
  var setNutrition = nutritionState[1];
  var ventState = useStorage('orbitwell-private-reflections', []);
  var setVent = ventState[1];
  var photoState = useStorage('orbitwell-health-photos', []);
  var setPhotos = photoState[1];
  var routineState = useStorage('orbitwell-routine', {});
  var setRoutine = routineState[1];
  var snapshots = photoState[0];
  var reflections = ventState[0];
  var nutrition = nutritionState[0];
  var routine = routineState[0];
  var deviceList = bluetooth.discoveredDevices || [];
  var capture = function(source) {
    var action = source === 'camera' ? camera.takePhoto : camera.pickImage;
    action().then(function(result) {
      if (result.error) {
        Platform.OS === 'web' ? window.alert('Photo unavailable: ' + result.error) : Alert.alert('Photo unavailable', result.error);
        return;
      }
      if (!result.cancelled && result.uri) {
        setPhotos(function(previous) { return [{ uri: result.uri, recordedAt: new Date().toISOString() }].concat(previous || []).slice(0, 12); });
      }
    }).catch(function(error) {
      Platform.OS === 'web' ? window.alert('Photo unavailable: ' + error.message) : Alert.alert('Photo unavailable', error.message);
    });
  };
  var startScan = function() {
    setScanState(true);
    setScanMessageState('');
    bluetooth.scan({ timeout: 8000 }).then(function(result) {
      setScanState(false);
      if (result.error) {
        setScanMessageState(result.error);
        if (result.error === 'Bluetooth is not enabled') bluetooth.requestEnable();
      } else {
        setScanMessageState('Nearby devices found. Device measurements are not imported by this prototype.');
      }
    }, function(error) {
      setScanState(false);
      setScanMessageState(error.message || 'Could not scan for nearby devices.');
    });
  };
  var scrollHeight = windowHeight - insets.top - insets.bottom;
  var bodyInfo = {
    Heart: 'Altered gravity can change cardiovascular workload and fluid distribution. Track resting pulse and blood pressure against your mission baseline.',
    Brain: 'Isolation, confinement, sleep disruption, and distance from Earth can affect focus and emotional wellbeing. Notice sustained changes and seek crew support.',
    Bones: 'Reduced mechanical loading can contribute to bone and muscle loss. Follow the prescribed exercise and nutrition plan; report new pain or weakness.',
    Skin: 'A new rash or mark deserves observation. Capture a dated image for comparison and contact the medical team for spreading, painful, or concerning changes.'
  };
  var habits = ['Daily health check-in', 'Mission exercise plan', 'Pause for a breathing reset'];
  return React.createElement(View, { style: styles.screen, componentId: 'mission-screen' },
    React.createElement(StatusBar, { backgroundColor: backgroundColor, barStyle: 'light-content' }),
    React.createElement(ScrollView, { style: { height: scrollHeight }, contentContainerStyle: { paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING }, keyboardShouldPersistTaps: 'handled', componentId: 'mission-scroll' },
      React.createElement(Text, { style: styles.title, componentId: 'mission-title' }, 'Mission companion'),
      React.createElement(Text, { style: [styles.secondary, { marginTop: 6 }], componentId: 'mission-subtitle' }, 'Physical health, mental wellbeing, and everyday routines—kept on this device.'),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'mission-body-heading' }, 'Explore your body'),
      React.createElement(View, { style: styles.bodyChips, componentId: 'mission-body-options' },
        ['Heart', 'Brain', 'Bones', 'Skin'].map(function(part) {
          return React.createElement(TouchableOpacity, { key: part, style: [styles.bodyChip, bodyState[0] === part ? { backgroundColor: accentSoftColor, borderColor: accentColor } : null], onPress: function() { bodyState[1](part); }, activeOpacity: 0.7, componentId: 'mission-body-' + part.toLowerCase() },
            React.createElement(Text, { style: styles.rowValue }, part)
          );
        })
      ),
      React.createElement(View, { style: [styles.callout, { marginTop: 10 }], componentId: 'mission-body-info' },
        React.createElement(Text, { style: styles.rowTitle, componentId: 'mission-body-info-title' }, bodyState[0] + ' · spaceflight context'),
        React.createElement(Text, { style: [styles.body, { marginTop: 8 }], componentId: 'mission-body-info-copy' }, bodyInfo[bodyState[0]] || 'Health guidance will be shown here.')
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'mission-scanner-heading' }, 'Skin and symptom photos'),
      React.createElement(View, { style: styles.card, componentId: 'mission-scanner-card' },
        React.createElement(Text, { style: [styles.secondary, { padding: 12 }], componentId: 'mission-scanner-note' }, 'Take a dated photo or choose one from your library to compare visible changes over time. Photos stay on this device; they are not a diagnosis.'),
        React.createElement(View, { style: styles.actionRow, componentId: 'mission-photo-actions' },
          React.createElement(TouchableOpacity, { style: [styles.button, styles.flexButton], activeOpacity: 0.7, onPress: function() { capture('camera'); }, componentId: 'mission-take-photo' }, React.createElement(Text, { style: styles.buttonText }, 'Take photo')),
          React.createElement(TouchableOpacity, { style: [styles.button, styles.flexButton, { backgroundColor: primaryColor }], activeOpacity: 0.7, onPress: function() { capture('library'); }, componentId: 'mission-pick-photo' }, React.createElement(Text, { style: styles.buttonText }, 'Choose photo'))
        ),
        camera.error ? React.createElement(Text, { style: [styles.rowMeta, { padding: 12 }], componentId: 'mission-camera-error' }, camera.error) : null,
        snapshots.length ? snapshots.map(function(photo, index) {
          return React.createElement(View, { key: String(photo.recordedAt || index), style: styles.photoRow, componentId: 'mission-photo-' + index },
            React.createElement(Image, { source: { uri: photo.uri }, style: styles.snapshot, resizeMode: 'cover', componentId: 'mission-photo-image-' + index }),
            React.createElement(Text, { style: styles.rowMeta, componentId: 'mission-photo-date-' + index }, formatDate(photo.recordedAt) + ' · saved privately on this device')
          );
        }) : React.createElement(Text, { style: styles.listEmpty, componentId: 'mission-photo-empty' }, 'No health photos saved yet.')
      ),
      // Wearable discovery uses Web Bluetooth, so it is only shown on the web build.
      Platform.OS === 'web' ? React.createElement(Text, { style: styles.sectionHeading, componentId: 'mission-wearable-heading' }, 'Wearable discovery') : null,
      Platform.OS === 'web' ? React.createElement(View, { style: styles.card, componentId: 'mission-wearable-card' },
        React.createElement(Text, { style: [styles.secondary, { padding: 12 }], componentId: 'mission-wearable-note' }, 'Scan for nearby Bluetooth devices. This prototype does not connect a specific watch or import health measurements.'),
        React.createElement(TouchableOpacity, { style: [styles.button, { marginHorizontal: 12 }], activeOpacity: 0.7, onPress: startScan, componentId: 'mission-wearable-scan' }, React.createElement(Text, { style: styles.buttonText }, scanState[0] ? 'Scanning…' : 'Scan nearby devices')),
        scanMessageState[0] ? React.createElement(Text, { style: [styles.rowMeta, { padding: 12 }], componentId: 'mission-wearable-status' }, scanMessageState[0]) : null,
        deviceList.length ? deviceList.map(function(device, index) {
          return React.createElement(Text, { key: device.id || String(index), style: [styles.rowMeta, { padding: 10 }], componentId: 'mission-device-' + index }, (device.name || device.localName || 'Unnamed device') + (device.rssi == null ? '' : ' · ' + device.rssi + ' dBm'));
        }) : React.createElement(Text, { style: styles.listEmpty, componentId: 'mission-device-empty' }, 'No devices discovered in the current scan.')
      ) : null,
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'mission-nutrition-heading' }, 'Nutrition log'),
      React.createElement(View, { style: styles.card, componentId: 'mission-nutrition-card' },
        React.createElement(Text, { style: [styles.secondary, { padding: 12 }], componentId: 'mission-nutrition-copy' }, 'Record a meal or hydration note to support your mission nutrition plan.'),
        React.createElement(TextInput, { style: [styles.inputWrap, { marginHorizontal: 12, paddingHorizontal: 12 }], value: foodDraftState[0], onChangeText: foodDraftState[1], placeholder: 'Meal or nutrition note', placeholderTextColor: textSecondary, multiline: true, numberOfLines: 3, textAlignVertical: 'top', autoCapitalize: 'sentences', autoCorrect: true, componentId: 'mission-nutrition-input' }),
        React.createElement(TouchableOpacity, { style: [styles.button, { margin: 12 }], activeOpacity: 0.7, onPress: function() {
          var text = foodDraftState[0].trim();
          if (!text) return;
          setNutrition(function(previous) { return [{ text: text, recordedAt: new Date().toISOString() }].concat(previous || []).slice(0, 30); });
          foodDraftState[1]('');
        }, componentId: 'mission-nutrition-save' }, React.createElement(Text, { style: styles.buttonText }, 'Save meal note')),
        nutrition.length ? nutrition.slice(0, 5).map(function(entry, index) {
          return React.createElement(View, { key: String(entry.recordedAt || index), style: styles.historyRow, componentId: 'mission-nutrition-entry-' + index },
            React.createElement(Text, { style: styles.rowTitle }, entry.text || ''),
            React.createElement(Text, { style: styles.rowMeta }, formatDate(entry.recordedAt))
          );
        }) : React.createElement(Text, { style: styles.listEmpty, componentId: 'mission-nutrition-empty' }, 'No meal notes yet.')
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'mission-vent-heading' }, 'Space to Vent'),
      React.createElement(View, { style: styles.card, componentId: 'mission-vent-card' },
        React.createElement(Text, { style: [styles.secondary, { padding: 12 }], componentId: 'mission-vent-copy' }, 'A private on-device reflection space. This app does not provide clinical or AI counseling. For urgent concerns, contact crew support using your mission procedure.'),
        React.createElement(TextInput, { style: [styles.inputWrap, { marginHorizontal: 12, padding: 12, minHeight: 92 }], value: ventDraftState[0], onChangeText: ventDraftState[1], placeholder: 'Write what is on your mind…', placeholderTextColor: textSecondary, multiline: true, numberOfLines: 4, textAlignVertical: 'top', autoCapitalize: 'sentences', autoCorrect: true, componentId: 'mission-vent-input' }),
        React.createElement(TouchableOpacity, { style: [styles.button, { margin: 12 }], activeOpacity: 0.7, onPress: function() {
          var text = ventDraftState[0].trim();
          if (!text) return;
          setVent(function(previous) { return [{ text: text, recordedAt: new Date().toISOString() }].concat(previous || []).slice(0, 20); });
          ventDraftState[1]('');
        }, componentId: 'mission-vent-save' }, React.createElement(Text, { style: styles.buttonText }, 'Save private reflection')),
        reflections.length ? React.createElement(Text, { style: [styles.rowMeta, { padding: 12 }], componentId: 'mission-vent-count' }, reflections.length + ' private reflection' + (reflections.length === 1 ? '' : 's') + ' saved on this device.') : React.createElement(Text, { style: styles.listEmpty, componentId: 'mission-vent-empty' }, 'No reflections saved.')
      ),
      React.createElement(Text, { style: styles.sectionHeading, componentId: 'mission-routine-heading' }, 'Daily mission routine'),
      React.createElement(View, { style: styles.card, componentId: 'mission-routine-card' },
        habits.map(function(habit, index) {
          var checked = !!routine[habit];
          return React.createElement(TouchableOpacity, { key: habit, style: styles.routineRow, activeOpacity: 0.7, onPress: function() { setRoutine(function(previous) { return Object.assign({}, previous, { [habit]: !previous[habit] }); }); }, componentId: 'mission-routine-' + index },
            React.createElement(View, { style: [styles.checkbox, checked ? styles.checkboxDone : null] }, checked ? React.createElement(Ionicons, { name: 'checkmark', size: 17, color: onAccentColor }) : null),
            React.createElement(Text, { style: [styles.rowTitle, { flex: 1 }] }, habit),
            React.createElement(Text, { style: styles.rowMeta }, checked ? 'Done' : 'To do')
          );
        }),
        React.createElement(Text, { style: [styles.rowMeta, { padding: 12 }], componentId: 'mission-badge' }, Object.keys(routine).filter(function(key) { return routine[key]; }).length >= habits.length ? 'Routine badge earned · All listed habits checked.' : 'Complete all three habits to earn today’s routine badge.')
      ),
      React.createElement(View, { style: [styles.callout, { marginTop: 20 }], componentId: 'mission-safety-callout' },
        React.createElement(Text, { style: styles.rowTitle, componentId: 'mission-safety-title' }, 'Safety first'),
        React.createElement(Text, { style: [styles.body, { marginTop: 8 }], componentId: 'mission-safety-copy' }, 'This tool organizes observations; it does not diagnose, replace a clinician, or send alerts to Earth. Follow approved onboard procedures and report concerning or persistent changes.')
      )
    )
  );
};
// @end:MissionScreen

// @section:styles @depends:[theme]
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: backgroundColor },
  starfield: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
  title: { color: textPrimary, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  sectionTitle: { color: textPrimary, fontSize: 20, lineHeight: 25, fontWeight: '600' },
  sectionHeading: { color: textPrimary, fontSize: 20, lineHeight: 25, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  body: { color: textPrimary, fontSize: 15, lineHeight: 20 },
  secondary: { color: textSecondary, fontSize: 14, lineHeight: 19 },
  rowTitle: { color: textPrimary, fontSize: 16, lineHeight: 20, fontWeight: '600' },
  rowMeta: { color: textSecondary, fontSize: 13, lineHeight: 17 },
  rowValue: { color: textPrimary, fontSize: 14, lineHeight: 19, fontWeight: '600' },
  card: { backgroundColor: cardColor, borderRadius: radiusMd },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: borderColor },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: borderColor, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { borderColor: accentColor, backgroundColor: accentColor },
  listEmpty: { color: textSecondary, fontSize: 15, lineHeight: 20, padding: 16 },
  button: { minHeight: 52, minWidth: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: accentColor, borderRadius: radiusSm, paddingHorizontal: 16 },
  buttonText: { color: onAccentColor, fontSize: 16, lineHeight: 20, fontWeight: '600' },
  progressBlock: { marginTop: 24 },
  progressCopy: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { height: 4, backgroundColor: borderColor },
  emptyBlock: { minHeight: 420, alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: radiusMd, backgroundColor: accentSoftColor, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyCopy: { color: textSecondary, fontSize: 16, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  errorBlock: { minHeight: 380, justifyContent: 'center', gap: 12 },
  backHeader: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  backTitle: { flex: 1, color: textPrimary, fontSize: 20, lineHeight: 25, fontWeight: '600' },
  field: { padding: 12, borderBottomWidth: 1, borderBottomColor: borderColor },
  fieldTop: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: backgroundColor, borderWidth: 1, borderColor: borderColor, borderRadius: radiusSm, color: textPrimary, fontSize: 16 },
  input: { flex: 1, minHeight: 46, paddingHorizontal: 12, color: textPrimary, fontSize: 16 },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodOption: { flex: 1, minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill, backgroundColor: backgroundColor },
  readingCard: { padding: 16, backgroundColor: cardColor, borderRadius: radiusMd },
  overline: { color: textSecondary, fontSize: 13, lineHeight: 17, fontWeight: '600', letterSpacing: 0.6 },
  bigNumber: { color: textPrimary, fontSize: 40, lineHeight: 48, fontWeight: '700', marginTop: 8 },
  statusRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: radiusPill, backgroundColor: accentColor },
  levelBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radiusPill, paddingVertical: 3, paddingHorizontal: 8 },
  levelBadgeText: { fontSize: 13, fontWeight: '600', marginLeft: 4 },
  envCard: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: cardColor, borderRadius: radiusMd, borderWidth: 1, borderColor: borderColor },
  alertCard: { marginTop: 12, padding: 16, backgroundColor: cardColor, borderRadius: radiusMd, borderWidth: 1 },
  bodyFigure: { alignSelf: 'center', width: 180, height: 260, marginTop: 12, position: 'relative' },
  bodyPart: { position: 'absolute', backgroundColor: surfaceAltColor, borderWidth: 1, borderColor: borderColor },
  bodyMarker: { position: 'absolute', width: 26, height: 26, marginLeft: -13, marginTop: -13, borderRadius: radiusPill, borderWidth: 3 },
  bodyLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, marginVertical: 2 },
  chartArea: { height: 120, flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 1, borderColor: borderColor },
  chartColumn: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  callout: { padding: 16, backgroundColor: accentSoftColor, borderRadius: radiusMd },
  spaceBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusChip: { color: highlightColor, backgroundColor: accentSoftColor, borderRadius: radiusPill, paddingVertical: 4, paddingHorizontal: 8, fontSize: 13, fontWeight: '600' },
  trendRow: { minHeight: 32, flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  trendBar: { flex: 1, minWidth: 8, backgroundColor: accentColor, borderRadius: radiusSm },
  referenceLine: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderColor },
  guideRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: borderColor },
  guideIcon: { width: 40, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  guideStep: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: borderColor },
  stepNumber: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radiusPill, backgroundColor: accentSoftColor },
  orbitMark: { width: 112, height: 112, borderWidth: 2, borderColor: '#3D8BFF', borderRadius: radiusPill, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: '#0B1B32' },
  orbitCore: { width: 56, height: 56, borderRadius: radiusPill, backgroundColor: '#183B68', alignItems: 'center', justifyContent: 'center' },
  orbitDot: { width: 16, height: 16, borderRadius: radiusPill, backgroundColor: '#8CC5FF' },
  bodyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bodyChip: { borderWidth: 1, borderColor: borderColor, borderRadius: radiusPill, backgroundColor: cardColor, paddingVertical: 10, paddingHorizontal: 16 },
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  flexButton: { flex: 1 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderTopWidth: 1, borderTopColor: borderColor },
  snapshot: { width: 72, height: 72, borderRadius: radiusSm, backgroundColor: surfaceAltColor },
  historyRow: { padding: 12, borderTopWidth: 1, borderTopColor: borderColor, gap: 4 },
  routineRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: borderColor }
});
// @end:styles

// @section:TabNavigator @depends:[TodayScreen,MeasuresScreen,HealthScreen,ProfileScreen,MissionScreen,navigation-setup]
var TabNavigator = function() {
  var insets = useSafeAreaInsets();
  return React.createElement(View, { style: { flex: 1, width: '100%', height: '100%', overflow: 'hidden' }, componentId: 'main-tabs-wrap' },
    React.createElement(Tab.Navigator, {
      screenOptions: function(info) {
        var icons = {
          Today: ['home', 'home-outline'],
          Mission: ['planet', 'planet-outline'],
          Measures: ['barbell', 'barbell-outline'],
          Health: ['heart', 'heart-outline'],
          Profile: ['person', 'person-outline']
        };
        return {
          headerShown: false,
          hikariLiquidGlass: true,
          tabBarActiveTintColor: highlightColor,
          tabBarInactiveTintColor: textSecondary,
          tabBarActiveBackgroundColor: cardColor,
          tabBarInactiveBackgroundColor: cardColor,
          tabBarLabelStyle: { fontSize: 11, lineHeight: 13, fontWeight: '600' },
          tabBarItemStyle: { padding: 0 },
          tabBarStyle: { position: 'absolute', bottom: 0, height: Platform.OS === 'web' ? TAB_MENU_HEIGHT : TAB_MENU_HEIGHT + insets.bottom, paddingBottom: 0, borderTopWidth: 0, backgroundColor: cardColor },
          tabBarIcon: function(iconProps) {
            var pair = icons[info.route.name] || icons.Today;
            return React.createElement(Ionicons, { name: iconProps.focused ? pair[0] : pair[1], size: 24, color: iconProps.color });
          }
        };
      }
    },
      React.createElement(Tab.Screen, { name: 'Today', component: TodayScreen }),
      React.createElement(Tab.Screen, { name: 'Mission', component: MissionScreen }),
      React.createElement(Tab.Screen, { name: 'Measures', component: MeasuresScreen }),
      React.createElement(Tab.Screen, { name: 'Health', component: HealthScreen }),
      React.createElement(Tab.Screen, { name: 'Profile', component: ProfileScreen })
    )
  );
};
// @end:TabNavigator

// @section:MainNavigator @depends:[TabNavigator,CheckInScreen,HealthReviewScreen,IndicatorDetailScreen,GuidanceDetailScreen,navigation-setup]
var MainNavigator = function() {
  return React.createElement(Stack.Navigator, { initialRouteName: 'Main', screenOptions: { headerShown: false } },
    React.createElement(Stack.Screen, { name: 'Main', component: TabNavigator }),
    React.createElement(Stack.Screen, { name: 'CheckIn', component: CheckInScreen }),
    React.createElement(Stack.Screen, { name: 'HealthReview', component: HealthReviewScreen, initialParams: { recordId: null } }),
    React.createElement(Stack.Screen, { name: 'IndicatorDetail', component: IndicatorDetailScreen, initialParams: { indicator: 'pressure' } }),
    React.createElement(Stack.Screen, { name: 'GuidanceDetail', component: GuidanceDetailScreen, initialParams: { guide: 'pressure' } }),
    React.createElement(Stack.Screen, { name: 'LibraryDetail', component: LibraryDetailScreen, initialParams: { topic: 'hazards' } })
  );
};
// @end:MainNavigator

// @section:return @depends:[ThemeContext,MainNavigator,sample-data,styles]
// Sample check-ins are only added to the web demo. Phone installs start empty,
// so a new user never sees readings that are not theirs.
if (Platform.OS === 'web') seedSampleRows(SAMPLE_ROWS);

export default function HealthMonitor() {
  return React.createElement(ThemeProvider, null,
    React.createElement(View, { style: { flex: 1, width: '100%', height: '100%' }, componentId: 'app-root' },
      React.createElement(MainNavigator)
    )
  );
}
// @end:return
