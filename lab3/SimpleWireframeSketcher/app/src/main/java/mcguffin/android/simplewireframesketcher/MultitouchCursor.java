
package mcguffin.android.simplewireframesketcher;


import java.util.ArrayList;

// This is used to store information about a single finger or other "pointer" (e.g., stylus, mouse).
// It stores the position and other state information.
public class MultitouchCursor {

	// BEGIN: things that should not change over the course of an instantiation of this class.
	//

	// The DT_ prefix means "Device Type"
	public static final int DT_MOUSE = 0;
	public static final int DT_FINGER = 1;
	public static final int DT_STYLUS = 2;
	public static final int DT_STYLUS_ERASER = 3;
	public int deviceType = -1;

	public boolean isStylusOrEraser() {
		return deviceType == DT_STYLUS || deviceType == DT_STYLUS_ERASER;
	}
	public boolean supportsHover() {
		return deviceType == DT_MOUSE || deviceType == DT_STYLUS || deviceType == DT_STYLUS_ERASER;
	}
	public boolean supportsPrecisePositioning() {
		return deviceType == DT_MOUSE || deviceType == DT_STYLUS;
	}
	public boolean supportsMultipleInstances() {
		return deviceType == DT_FINGER;
	}

	// raw_id is the id provided by the system, and may only allow disambiguation of fingers.
	// (There is no guarantee that the raw_id values are consecutive or in increasing order.)
	// To also allow for disambiguation of additonal types of cursors (like stylus or mouse),
	// we "hash" the raw id by adding information about the deviceType
	public int raw_id = -1; // a negative value means it wasn't initialized or no value is available
	public int hashed_id = -1; // uniquely identifies the cursor; a negative value means it wasn't initialized

	public static int computeHashedID(
		int deviceType,
		int raw_id /* caller should pass zero if no value is available to them */
	) {
		MultitouchFramework.Assert( deviceType >= 0 && raw_id >= 0, "88caf328" );
		return ( deviceType << 8 ) | raw_id;
	}

	public MultitouchCursor( int deviceType, int raw_id ) {
		this.deviceType = deviceType;
		this.raw_id = raw_id;
		this.hashed_id = computeHashedID( deviceType, raw_id );
	}

	//
	// END: things that should not change over the course of an instantiation of this class.


	// BEGIN: things that *could* change over the course of an instantiation of this class.
	//

	// The DS_ prefix means "Distance State"
	// In the case of a mouse, DS_TOUCHING means that at least one button is down.
	// In the case of a stylus or stylus eraser, DS_TOUCHING means that the device is touching the screen,
	// and ``distanceState'' is independent of whether the stylus's side buttons are pressed.
	//
	// Note that DS_OUT_OF_RANGE is used in two cases:
	// (1) when a new cursor is instantiated (because it begins hovering or touching),
	// its ``old_distanceState'' is set to DS_OUT_OF_RANGE;
	// and (2) when a cursor leaves, its ``distanceState'' is set to DS_OUT_OF_RANGE
	// and passed to the client (i.e., receiver) right before the cursor is deleted.
	//
	public static final int DS_OUT_OF_RANGE = 0;
	public static final int DS_HOVERING = 1;
	public static final int DS_TOUCHING = 2;
	public int distanceState = DS_OUT_OF_RANGE;

	// In the case of a mouse, these report the state of the mouse buttons,
	// and if any of them are down (i.e., true), then ``distanceState==DS_TOUCHING''.
	// In the case of a stylus or stylus eraser, they report the state of the side buttons
	// and are independent of ``distanceState''.
	public boolean button1 = false;
	public boolean button2 = false;

	public int x = 0; // in pixels; increases to the right
	public int y = 0; // in pixels; increases downward

	// (This stuff is only relevant for a stylus or stylus eraser.)
	public float z = 1; // distance from the screen, normalized to be in [0,1]
	public float pressure = 0; // normalized to be in [0,1]
	public float elevation = 0; // normalized to be in [-1,1]; -1 for handle pointing up and tip pointing down
	public float azimuth = 0; // normalized to be in [-1,1]; -1 for handle pointing left and tip pointing right


	private ArrayList< Point2D > historyOfPositions = new ArrayList< Point2D >(); // history of pixel coordinates; only recorded if the client asks for this
	private ArrayList< Point2D > inverseHistoryOfPositions = new ArrayList<>();

	public float totalDistanceAlongHistory = 0;
	public float straightLineDistanceFromStartOfHistory = 0;
	boolean mustSaveHistory = false;

	public void setSavingOfHistory( boolean flag /* true to start or re-start, false to stop */ ) {
		historyOfPositions.clear();
		totalDistanceAlongHistory = 0;
		straightLineDistanceFromStartOfHistory = 0;
		mustSaveHistory = flag;
		if ( mustSaveHistory && distanceState!=DS_OUT_OF_RANGE ) {
			historyOfPositions.add( new Point2D( x, y ) );
		}
	}

	public void setInverseHistoryOfPositions(ArrayList<Point2D> points ){

		inverseHistoryOfPositions = points;
	}

	public ArrayList<Point2D> getInverseHistoryOfPositions(){
		return inverseHistoryOfPositions;
	}

	public ArrayList< Point2D > getHistoryOfPositions() { return historyOfPositions; }
	public Point2D getCurrentPosition() { return new Point2D(x,y); }
	public Point2D getPreviousPosition() {
		if (historyOfPositions.size()>1)
			return historyOfPositions.get(historyOfPositions.size()-1);
		else if ( old_distanceState!=DS_OUT_OF_RANGE )
			return new Point2D(old_x,old_y);
		else return getCurrentPosition();
	}
	public Point2D getFirstPosition() { if (historyOfPositions.size()>0) return historyOfPositions.get(0); else return null; }
	
	//
	// END: things that *could* change over the course of an instantiation of this class.


	// BEGIN: the state of the cursor prior to the current event.
	//
	public int old_distanceState = DS_OUT_OF_RANGE;
	public boolean old_button1 = false;
	public boolean old_button2 = false;
	public int old_x = 0;
	public int old_y = 0;
	public float old_z = 1;
	public float old_pressure = 0;
	public float old_elevation = 0;
	public float old_azimuth = 0;

	private void copyCurrentStateToOldState() {
		// copy current state to old state
		old_distanceState = distanceState;
		old_button1 = button1;
		old_button2 = button2;
		old_x = x;
		old_y = y;
		old_z = z;
		old_pressure = pressure;
		old_elevation = elevation;
		old_azimuth = azimuth;
	}

	public void update( int new_distanceState ) {
		copyCurrentStateToOldState();
		this.distanceState = new_distanceState;
	}

	public void update(
		int new_distanceState,
		boolean new_button1,
		boolean new_button2,
		int new_x,
		int new_y,
		float new_z,
		float new_pressure,
		float new_elevation,
		float new_azimuth
	) {
		copyCurrentStateToOldState();

		distanceState = new_distanceState;
		button1 = new_button1;
		button2 = new_button2;
		x = new_x;
		y = new_y;
		z = new_z;
		pressure = new_pressure;
		elevation = new_elevation;
		azimuth = new_azimuth;

		if ( mustSaveHistory && new_distanceState!=DS_OUT_OF_RANGE ) {
			Point2D p = new Point2D( x, y );
			historyOfPositions.add( p );
			if ( old_distanceState!=DS_OUT_OF_RANGE && historyOfPositions.size() >= 2 ) {
				Point2D previous_p = historyOfPositions.get( historyOfPositions.size() - 2 );
				totalDistanceAlongHistory += p.distance( previous_p );
				straightLineDistanceFromStartOfHistory = p.distance( historyOfPositions.get(0) );
			}
		}
	}

	// The below stuff is to help a client (i.e., receiver) process an input event.
	// Client code that processes an event is free to branch according to the cursor's ``distanceState'',
	// or the type of change that happened (change in ``distanceState'', change in buttons, change in position ...)
	// or the values of ``old_distanceState'' and ``distanceState''.
	// Clients are also free to group transitions between distance states together in switch statements.
	// For example, if a client wants to react to a cursor first touching down,
	// it could group together
	//      case EVENT_OUT_OF_RANGE_TO_TOUCHING :
	//      case EVENT_HOVERING_TO_TOUCHING :
	//         ...
	//         break;
	//

	public boolean didDistanceStateChange() { return distanceState != old_distanceState; }
	public boolean didButtonsChange() { return button1 != old_button1 || button2 != old_button2; }
	public boolean didPositionChange() { return x!=old_x || y!=old_y || z!=old_z; }
	public boolean didPressureChange() { return pressure!=old_pressure; }
	public boolean didAngleChange() { return elevation!=old_elevation || azimuth!=old_azimuth; }
	public boolean isThisCursorNew() { return old_distanceState==DS_OUT_OF_RANGE; }
	public boolean isThisCursorBeingLiftedAway() { return distanceState==DS_OUT_OF_RANGE; }

	// A cursor instance is guaranteed to start with ``old_distanceState==DS_OUT_OF_RANGE''
	// and end with ``distanceState==DS_OUT_OF_RANGE'',
	// and the (top-level) receiver will be given a chance to process all changes in ``distanceState'',
	// and the sequence of events for a cursor is guaranteed to start with
	// either EVENT_OUT_OF_RANGE_TO_HOVERING or EVENT_OUT_OF_RANGE_TO_TOUCHING,
	// and end with either EVENT_HOVERING_TO_OUT_OF_RANGE or EVENT_TOUCHING_TO_OUT_OF_RANGE.
	// Note 1: a child receiver with siblings may not receive all state changes,
	// because a cursor may leave the geometry of one child and enter another's,
	// but in this case the children will receive GE_EXIT and GE_ENTER events.
	// Note 2: some unusual sequences may occur.
	// For example, with Android, it seems that when a stylus transitions from hovering to dragging,
	// the Android listeners get ACTION_HOVER_EXIT followed by ACTION_DOWN,
	// and when the stylus transitions from dragging to hovering,
	// they get ACTION_UP followed by ACTION_HOVER_ENTER.
	// So ACTION_HOVER_EXIT may mean that the stylus has been lifted far away,
	// or may mean that it is now touching the screen.
	// For simplicity, the Android version of our framework code (probably)
	// always translates ACTION_HOVER_EXIT into EVENT_HOVERING_TO_OUT_OF_RANGE,
	// so that the complete sequence for a stylus brought into range, dragged, and then taken away could be
	//    (cursor instantiated)
	//    EVENT_OUT_OF_RANGE_TO_HOVERING
	//    EVENT_WHILE_HOVERING (probably multiple times)
	//    EVENT_HOVERING_TO_OUT_OF_RANGE
	//    (cursor deleted; new cursor instantiated with possibly different id)
	//    EVENT_OUT_OF_RANGE_TO_TOUCHING
	//    EVENT_WHILE_TOUCHING (probably multiple times)
	//    EVENT_TOUCHING_TO_OUT_OF_RANGE
	//    (cursor deleted; new cursor instantiated with possibly different id)
	//    EVENT_OUT_OF_RANGE_TO_HOVERING
	//    EVENT_WHILE_HOVERING (probably multiple times)
	//    EVENT_HOVERING_TO_OUT_OF_RANGE
	//    (cursor deleted)
	// However, with a Wacom Cintiq touch screen (not the "Companion" tablet), the sequence might instead be
	//    (cursor instantiated)
	//    EVENT_OUT_OF_RANGE_TO_HOVERING
	//    EVENT_WHILE_HOVERING (probably multiple times)
	//    EVENT_HOVERING_TO_TOUCHING
	//    EVENT_WHILE_TOUCHING (probably multiple times)
	//    EVENT_TOUCHING_TO_HOVERING
	//    EVENT_WHILE_HOVERING (probably multiple times)
	//    EVENT_HOVERING_TO_OUT_OF_RANGE
	//    (cursor deleted)
	//
	// Note 3: that if a client receives an EVENT_WHILE_HOVERING or EVENT_WHILE_TOUCHING,
	// it may be due to a change in position (movement or dragging)
	// or it may be due to some other change in the cursor such as pressure or angle.
	//
	public static final int EVENT_OUT_OF_RANGE_TO_HOVERING = (DS_OUT_OF_RANGE<<4) | DS_HOVERING;
	public static final int EVENT_OUT_OF_RANGE_TO_TOUCHING = (DS_OUT_OF_RANGE<<4) | DS_TOUCHING;
	public static final int EVENT_HOVERING_TO_OUT_OF_RANGE = (DS_HOVERING    <<4) | DS_OUT_OF_RANGE;
	public static final int EVENT_HOVERING_TO_TOUCHING =     (DS_HOVERING    <<4) | DS_TOUCHING;
	public static final int EVENT_TOUCHING_TO_OUT_OF_RANGE = (DS_TOUCHING    <<4) | DS_OUT_OF_RANGE;
	public static final int EVENT_TOUCHING_TO_HOVERING =     (DS_TOUCHING    <<4) | DS_HOVERING;
	public static final int EVENT_WHILE_HOVERING =           (DS_HOVERING    <<4) | DS_HOVERING;
	public static final int EVENT_WHILE_TOUCHING =           (DS_TOUCHING    <<4) | DS_TOUCHING;
	public int getDistanceStateEventType() {
		return ( old_distanceState << 4 ) | distanceState;
	}
	//
	// END: the state of the cursor prior to the current event.
}

