package mcguffin.android.simplewireframesketcher;


import java.util.ArrayList;

public interface MultitouchDispatcher {
	// The GE_ prefix means "Geometry Event".
	// "Enter" and "exit" refer to 2D motions into, or out of, the receiver's (widget) boundaries,
	// and are not the same as a cursor's ``distanceState'' changing from, or to, ``DS_OUT_OF_RANGE''.
	// However, it may happen that a change in ``distanceState'' happens at the same time
	// as a geometry event of GE_ENTER or GE_EXIT.
	public static final int GE_ENTER = 0;
	public static final int GE_NONE = 1;
	public static final int GE_EXIT = 2;

	// This is useful for clients that want to obtain all their currently assigned cursors.
	public ArrayList< MultitouchCursor > getCursorsOfReceiver( MultitouchReceiver childReceiver );

	// This is useful for clients that want to obtain their one currently assigned cursor.
	// Useful especially for receivers that only ever accept one cursor.
	// Returns null if none is available, or null if there are more than one available.
	public MultitouchCursor getUniqueCursorOfReceiver( MultitouchReceiver childReceiver );

	// This is useful for clients that want to process pinch gestures involving two fingers,
	// or, more generally, involving two cursors.
	// If a child receiver has two cursors assigned to it by its parent dispatcher,
	// and one of the cursors is the one passed to this method,
	// then the other cursor is returned.
	// Otherwise, null is returned.
	public MultitouchCursor getOtherCursorOfReceiver( MultitouchReceiver childReceiver, MultitouchCursor oneCursor );
}



