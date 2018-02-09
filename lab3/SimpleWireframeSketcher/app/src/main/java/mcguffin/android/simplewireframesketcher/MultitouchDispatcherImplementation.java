package mcguffin.android.simplewireframesketcher;


import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;

// Any parent widget, or any object that has multiple child receivers "below" it,
// can implement the MultitouchReceiver interface to receive events,
// and delegate to an instance of this class to dispatch them to the child receivers.
public class MultitouchDispatcherImplementation implements MultitouchDispatcher {

	private ArrayList< MultitouchReceiver > receivers = new ArrayList< MultitouchReceiver >();
	private ArrayList< MultitouchCursor > cursors = new ArrayList< MultitouchCursor >();
	private HashMap< MultitouchCursor, MultitouchReceiver > cursorsAndReceivers
		= new HashMap< MultitouchCursor, MultitouchReceiver >();

	// for adding a child
	public void addReceiver( MultitouchReceiver r ) {
		receivers.add( r );
	}

	// Returns the receiver containing the given point, or null if there is none.
	private MultitouchReceiver findReceiverContaining( int x, int y ) {
		for ( MultitouchReceiver r : receivers ) {
			if ( r.isInside(x,y) )
				return r;
		}
		return null;
	}

	public ArrayList< MultitouchCursor > getCursorsOfReceiver( MultitouchReceiver r ) {
		ArrayList< MultitouchCursor > l = new ArrayList< MultitouchCursor >();
		for ( Map.Entry<MultitouchCursor, MultitouchReceiver> entry : cursorsAndReceivers.entrySet() ) {
			if ( entry.getValue() == r ) {
				l.add( entry.getKey() );
			}
		}
		return l;
	}

	public MultitouchCursor getUniqueCursorOfReceiver( MultitouchReceiver r ) {
		ArrayList< MultitouchCursor > l = getCursorsOfReceiver( r );
		if ( l.size() == 1 )
			return l.get(0);
		return null;
	}

	public MultitouchCursor getOtherCursorOfReceiver( MultitouchReceiver r, MultitouchCursor oneCursor ) {
		ArrayList< MultitouchCursor > l = getCursorsOfReceiver( r );
		if ( l.size() == 2 ) {
			MultitouchCursor c0 = l.get(0);
			MultitouchCursor c1 = l.get(1);
			return ( oneCursor == c0 ) ? c1 : c0;
		}
		return null;
	}

	public void dispatchToChildReceivers( MultitouchDispatcher parentDispatcher, MultitouchCursor c, int geometryEvent ) {
		if ( ! cursors.contains(c) ) { // if we haven't seen this cursor before ...
			MultitouchFramework.Assert( geometryEvent==MultitouchDispatcher.GE_ENTER || c.isThisCursorNew(), "c0bac526" );

			// figure out which receiver to assign the cursor to
			MultitouchReceiver r = findReceiverContaining(c.x,c.y);
			if ( r!=null && r.isDeviceAcceptable(c.deviceType) && getCursorsOfReceiver(r).size()<r.maxNumAcceptedCursors() ) {
				cursors.add( c );
				cursorsAndReceivers.put( c, r );
				r.processEvent( this, c, geometryEvent );
			}
			else {
				// no receiver was found willing to accept the cursor, so we block the cursor
				r = null;
				cursors.add( c );
				cursorsAndReceivers.put( c, r );
			}
		}
		else {
			MultitouchReceiver r = cursorsAndReceivers.get( c );
			if ( geometryEvent==MultitouchDispatcher.GE_EXIT || c.isThisCursorBeingLiftedAway() ) { // if this cursor is on its way out ...
				if ( r != null )
					r.processEvent( this, c, geometryEvent );

				// remove the cursor from our internal bookkeeping
				cursorsAndReceivers.remove( c );
				cursors.remove( c );
			}
			else {
				MultitouchFramework.Assert( geometryEvent==MultitouchDispatcher.GE_NONE && !c.isThisCursorNew() && !c.isThisCursorBeingLiftedAway(), "24cfb3ad" );

				// if we should check for geometry events due to our receivers' geometry ...
				if ( c.distanceState!=MultitouchCursor.DS_TOUCHING || (r!=null && !r.draggingCursorsCannotExit()) ) {
					MultitouchReceiver r2 = findReceiverContaining(c.x,c.y);
					if ( r2 != r ) {
						if ( r2!=null && r2.isDeviceAcceptable(c.deviceType) && getCursorsOfReceiver(r2).size()<r2.maxNumAcceptedCursors() ) {
							// there will be a geometry event
						}
						else {
							// no new receiver was found willing to accept the cursor, so we block the cursor
							r2 = null;
						}

						if ( r2 != r ) { // there is a geometry event
							if ( r != null ) r.processEvent( this, c, MultitouchDispatcher.GE_EXIT );
							cursorsAndReceivers.put( c, r2 );
							if ( r2 != null ) r2.processEvent( this, c, MultitouchDispatcher.GE_ENTER );
							return;
						}
					}
				}

				if ( r != null )
					r.processEvent( this, c, geometryEvent );
			}
		}

	}

}

