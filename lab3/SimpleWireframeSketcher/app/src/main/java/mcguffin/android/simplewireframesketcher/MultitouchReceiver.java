
package mcguffin.android.simplewireframesketcher;


public interface MultitouchReceiver {

	public static final int NO_LIMIT = 1024;

	// This should return 2 to allow for pinch gestures,
	// or 1 for just mono-point interaction,
	// or NO_LIMIT if there is no limit.
	// Returning zero will block all events.
	public int maxNumAcceptedCursors();

	// Used to tell the dispatcher if the given cursor's device type (DT_STYLUS, etc.) is acceptable.
	// This is the receiver's chance to tell the dispatcher if it doesn't want cursors from mice, stylus, fingers, etc.
	// It's important that the dispatcher know about this,
	// rather than simply pass all cursors on to the receiver only to have unacceptable ones ignored by the receiver,
	// because if we did that, then unacceptable cursors would count towards the receiver's expressed max number of cursors.
	public boolean isDeviceAcceptable( int deviceType );

	// If a cursor starts dragging on this receiver, and then drags off,
	// should the receiver continue to receive events about the cursor
	// until the drag ends?  If yes, then this should return true.
	// If this returns false, then dragging off a receiver will cause the
	// receiver to get a GE_EXIT and then the subsequent drag events will be passed
	// to some other receiver (if an appropriate one exists).
	public boolean draggingCursorsCannotExit();

	// Returns true if the given point, in pixels, is inside the receiver's geometry (or any of its children).
	public boolean isInside( int x, int y );

	// The receiver can ``ask'' the cursor about what changes have happened to the cursor
	// since the last event involving it, using methods like didButtonsChange() and getDistanceStateEventType().
	// We cannot, however, ask the cursor about geometry events,
	// because cursors do not store information about which receiver they are over,
	// because there may be an entire tree of dispatchers (parents) and receivers (children),
	// and therefore a single cursor could be over multiple receivers,
	// all of whom may be interesting in knowing when a cursor enters or leaves them.
	// That's why the geometry event information is passed as an additional parameter.
	public void processEvent( MultitouchDispatcher parentDispatcher, MultitouchCursor cursor, int geometryEvent );
}


